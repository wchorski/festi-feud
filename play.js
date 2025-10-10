import { State } from "./state.js"
import {
	answers_finals,
	answers_rounds,
	multiplicator,
	questions_finals,
	timers,
} from "./questions-demo.js"
import { apply_changes } from "./play/game.js"

/**
 * Audio files to be loaded
 * @type {Object.<string, string>} Format: filename without extension -> label
 */
const audiofiles = {
	yeah: "Yeah!",
	boo: "Boo!",
	beep: "Beep",
	clock: "Clock",
}

/**
 * Game window reference
 * @type {Window|null}
 */
let game = null

/**
 * Maximum number of answers per question
 * @type {number}
 */
let max_answers

/**
 * State manager instance
 * @type {State|null}
 */
let state = null

/**
 * Produces a changeset with an entry for every setting, set to a default value
 * @returns {Object.<string, any>} Initial changeset object
 */
function get_initial_changeset() {
	const init = {
		"teams.0.name": "Team left",
		"teams.0.points": 0,
		"teams.0.misses": 0,
		"teams.1.name": "Team right",
		"teams.1.points": 0,
		"teams.1.misses": 0,
		screen: "splash",
		"round.id": 0,
		"round.points": 0,
		"round.finished": false,
		"finals.points": 0,
	}

	for (let a = 0; a < max_answers; a++) init["round.answers_shown." + a] = -1

	for (let q = 0; q < answers_finals.length; q++) {
		for (let p = 0; p < 2; p++) {
			init["finals.answers." + p + "." + q + ".id"] = -1
			init["finals.answers." + p + "." + q + ".answer_shown"] = false
			init["finals.answers." + p + "." + q + ".points_shown"] = false
		}
	}

	return init
}

/**
 * Tasks to be run after DOM is fully loaded
 * @listens DOMContentLoaded
 */
document.addEventListener("DOMContentLoaded", function () {
	const openGameWindowBtn = document.getElementById("btn_open_win")
	if (!openGameWindowBtn) throw new Error("no btn_open_win el")
	openGameWindowBtn.addEventListener("pointerup", () => {
		open_game_window()
	})

	const gotToScreen = document.getElementById("btn_goto_rounds")
	if (!gotToScreen) throw new Error("no gotToScreen el")
	openGameWindowBtn.addEventListener("pointerup", () => {
		goto_screen("rounds")
	})

	// init audio files and play buttons
	const audiodiv = document.getElementById("audio")
	if (!audiodiv) throw new Error("id: audio. missing from html")
	Object.entries(audiofiles).forEach(([file, title]) => {
		const button = document.createElement("input")
		button.type = "button"
		button.id = "play_" + file
		button.value = title
		button.onclick = () => play_sound(file)
		audiodiv.appendChild(button)
	})

	// calculate maximum number of answers per round
	max_answers = 0
	answers_rounds.forEach((answers) => {
		if (answers.length > max_answers) max_answers = answers.length
	})

	// prepare answers for finals
	for (let p = 0; p < 2; p++) {
		const finalsdiv = document.getElementById("questions_p" + p)
		if (!finalsdiv) throw new Error("id: questions_p. missing from html")
		for (let q = 0; q < questions_finals.length; q++) {
			// list of correct answers
			let answers = `<select size="1" id="finals_answers_p${p}_${q}" onchange="finals_answer_changed(${p},${q});"><option value="-1" selected="selected"></option>`

			answers_finals[q].forEach((answer, idx_a) => {
				answers += `<option value="${idx_a}">${answer[0]} (${answer[1]})</option>`
			})
			answers += "</select>"

			// text field for wrong answer
			const wrong_answer = `<input type="text" size="25" id="finals_wrong_answer_p${p}_${q}" onchange="finals_answer_changed(${p},${q});" />`

			// checkboxes for visibility of answer and points
			let visible = `<input type="checkbox" id="finals_answer_visible_p${p}_${q}" value="1" onchange="finals_show_answer(${p},${q});" />Show answer `
			visible += `<input type="checkbox" id="finals_points_visible_p${p}_${q}" value="1" onchange="finals_show_points(${p},${q});" />Show points`

			// add entry for question
			const li = document.createElement("li")
			li.innerHTML = `${questions_finals[q]}<br />${answers}${wrong_answer}<br />${visible}`
			finalsdiv.appendChild(li)
		}
	}

	// enable/disable sound buttons
	mute_changed()

	// initialize game state
	state = new State(publish_changes)
	state.set_undo_listener((can_undo) => {
		document.getElementById("btn_undo").disabled = !can_undo
	})
	state.set_redo_listener((can_redo) => {
		document.getElementById("btn_redo").disabled = !can_redo
	})
	state.commit_changes(get_initial_changeset())
})

/**
 * Warn before closing window
 * @param {Event} e - Before unload event
 * @returns {string} Warning message
 */
window.onbeforeunload = function (e) {
	e = e || window.event
	if (e) e.returnValue = "*"
	return "*"
}

/**
 * Open the game in a popup window
 * @returns {void}
 */
function open_game_window() {
	game = window.open("game.html", "game", "width=1024,height=768,resizable=yes")
}

/**
 * Callback when game window is initialized
 * @returns {void}
 */
function game_window_init_done() {
	game.apply_changes(state.get_consolidated())
	game.set_timer(timer.get_time())
}

/**
 * Callback when game window is closed
 * @returns {void}
 */
function game_window_closed() {
	game = null
}

/**
 * Play sound object
 * @param {string} sound - Sound filename without extension
 * @returns {void}
 */
function play_sound(sound) {
	if (!document.getElementById("chk_mute").checked) {
		document.getElementById(
			"audiodummy"
		).innerHTML = `<audio src="/audio/${sound}.ogg" autoplay="autoplay" />`
	}
}

/**
 * Helper to publish changes to the game and control windows
 * Only to be called from State() objects!
 * @param {Object.<string, any>} changes - Changes to apply
 * @returns {void}
 */
function publish_changes(changes) {
	// apply changes to game window, if it has been opened
	if (game) {
		// game.apply_changes(changes)
		apply_changes(changes)
	}

	// apply changes locally
	Object.entries(changes).forEach(([setting, value]) => {
		const args = setting.split(".")
		const toplevel = args.shift()

		state_changer[toplevel](args, value)
	})
}

/**
 * Helper for finals: re-calculate total points
 * @param {Object.<string, any>} changes - Changes object to modify
 * @returns {Object.<string, any>} Modified changes object with recalculated points
 */
function finals_recalc_points(changes) {
	// combine state from history with current changes
	const current_state = state.get_consolidated()
	Object.entries(changes).forEach(([setting, value]) => {
		current_state[setting] = value
	})

	// re-calculate total points
	changes["finals.points"] = 0
	for (let p = 0; p < 2; p++) {
		for (let q = 0; q < questions_finals.length; q++) {
			const points_shown =
				current_state["finals.answers." + p + "." + q + ".points_shown"]
			const id = current_state["finals.answers." + p + "." + q + ".id"]
			let question_points = 0

			if (typeof id == "number" && id >= 0)
				question_points = answers_finals[q][id][1]

			if (points_shown) {
				changes["finals.points"] += question_points
			}
		}
	}

	return changes
}

// ##### start of timer #####

/**
 * Timer object for managing game timing
 * @namespace
 */
const timer = {
	/**
	 * @type {boolean}
	 * @private
	 */
	_running: false,

	/**
	 * @type {number}
	 * @private
	 */
	_timeleft: timers[0],

	/**
	 * Configure timer for given player
	 * @param {number} player - Player index
	 * @returns {void}
	 */
	init(player) {
		this.stop()
		this.set_time(timers[player])
	},

	/**
	 * Set timer value
	 * @param {number} timeleft - Time left in seconds
	 * @returns {void}
	 */
	set_time(timeleft) {
		this._timeleft = timeleft
		if (game) game.set_timer(timeleft)
	},

	/**
	 * Get timer value
	 * @returns {number} Time left in seconds
	 */
	get_time() {
		return this._timeleft
	},

	/**
	 * Start timer
	 * @returns {void}
	 */
	start() {
		this._running = true
		setTimeout(() => timer._tick(), 1000)
		document.getElementById("btn_timer_start").disabled = true
	},

	/**
	 * Stop timer
	 * @returns {void}
	 */
	stop() {
		this._running = false
		document.getElementById("btn_timer_start").disabled = false
	},

	/**
	 * Executed once a second while timer is running
	 * @private
	 * @returns {void}
	 */
	_tick() {
		const timeleft = this.get_time() - 1

		if (this._running) {
			this.set_time(timeleft)

			if (timeleft > 0) {
				setTimeout(() => timer._tick(), 1000)
			} else {
				this.stop()
				play_sound("clock")
			}
		}
	},
}

// ##### end of timer #####
// ##### start of state changer #####

/* !!! General rules for state changer !!!
 *
 * Don't use state from the document as it may not be valid at all.
 * Only state from state variables is guaranteed to be correct
 * (think undo/redo).
 *
 * Don't trigger further state changes as these can degrade
 * usability of undo/redo and might cause loops. Watch for document
 * changes that trigger event handlers which trigger state changes!
 */

/**
 * Contains change handlers for the control window
 * @namespace
 */
const state_changer = {
	/**
	 * Handle teams.* settings
	 * @param {string[]} args - Setting path arguments
	 * @param {any} value - New value
	 * @returns {void}
	 */
	teams(args, value) {
		const team = args.shift()
		const setting = args.shift()

		switch (setting) {
			case "name":
				// set team name
				document.getElementById("txt_name_" + team).value = value
				break

			case "misses":
				// set team misses
				document.getElementById("btn_miss" + team).disabled = value >= 3
				break
		}
	},

	/**
	 * Handle screen.* settings
	 * @param {string[]} args - Setting path arguments
	 * @param {any} value - New value
	 * @returns {void}
	 */
	screen(args, value) {
		// switch to screen
		document
			.querySelectorAll(".screen")
			.forEach((el) => (el.style.display = "none"))
		document.getElementById("view_" + value).style.display = "block"

		// stop timer
		if (value != "finals") {
			timer.stop()
		}
	},

	/**
	 * Handle round.* settings
	 * @param {string[]} args - Setting path arguments
	 * @param {any} value - New value
	 * @returns {void}
	 */
	round(args, value) {
		const setting = args.shift()

		switch (setting) {
			case "id":
				const idx_r = value

				// go to next round
				document.getElementById("round").textContent = idx_r + 1

				// generate answer buttons
				const answersWrap = document.getElementById("answers")
				if (!answersWrap)
					throw new Error("answersWrap id:answers missing from html")
				answersWrap.innerHTML = ""
				answers_rounds[idx_r].forEach((answer, idx_a) => {
					const val = answer[0] + " (" + answer[1] + ")"
					const button = document.createElement("input")
					button.type = "button"
					button.id = "answer" + idx_a
					button.value = val
					button.onclick = () => right_answer_given(idx_a)
					answersWrap.appendChild(button)
				})

				// enable/disable "next" buttons
				if (idx_r < multiplicator.length - 1) {
					document.getElementById("btn_next_round").disabled = false
					document.getElementById("btn_goto_finals").disabled = true
				} else {
					document.getElementById("btn_next_round").disabled = true
					document.getElementById("btn_goto_finals").disabled = false
				}
				break

			case "answers_shown":
				const idx_answer = args.shift()

				// enable/disable answer button
				const answerBtn = document.getElementById("answer" + idx_answer)
				if (answerBtn) {
					answerBtn.disabled = value >= 0
				}
				break

			case "finished":
				// disable "won" buttons if finished
				document.getElementById("btn_left_wins").disabled = value
				document.getElementById("btn_right_wins").disabled = value
				break
		}
	},

	/**
	 * Handle finals.* settings
	 * @param {string[]} args - Setting path arguments
	 * @param {any} value - New value
	 * @returns {void}
	 */
	finals(args, value) {
		const setting = args.shift()

		switch (setting) {
			case "answers":
				const player = args.shift()
				const question = args.shift()
				const setting2 = args.shift()

				switch (setting2) {
					case "id":
						// set default values for answer fields
						let right_answer_disabled = false
						let wrong_answer_disabled = false
						let right_answer_index = -1
						let wrong_answer_text = ""

						if (typeof value == "number") {
							// answer is numeric => chosen from right answers or no answer given
							right_answer_index = value

							if (value >= 0) {
								wrong_answer_disabled = true
							}
						} else {
							// answer is textual => wrong answer
							wrong_answer_text = value
							right_answer_disabled = true
						}

						// enable/disable answer fields
						const right_answer = document.getElementById(
							"finals_answers_p" + player + "_" + question
						)
						right_answer.value = right_answer_index
						right_answer.disabled = right_answer_disabled

						const wrong_answer = document.getElementById(
							"finals_wrong_answer_p" + player + "_" + question
						)
						wrong_answer.value = wrong_answer_text
						wrong_answer.disabled = wrong_answer_disabled
						break

					case "answer_shown":
						// show/hide answer
						const checkbox = document.getElementById(
							"finals_answer_visible_p" + player + "_" + question
						)
						checkbox.checked = value
						break

					case "points_shown":
						// show/hide points
						const checkbox2 = document.getElementById(
							"finals_points_visible_p" + player + "_" + question
						)
						checkbox2.checked = value
						break
				}
				break
		}
	},
}

// ##### end of state changer #####
// ##### start of event handlers #####

/* !!! General rules for event handlers !!!
 *
 * Don't change the document directly; always use commit_changes to
 * change the game state.
 *
 * Exception: Things that should not be visible in both the game
 * window and in undo/redo can be changed directly.
 */

/**
 * Update state of play buttons
 * @returns {void}
 */
function mute_changed() {
	const muted = document.getElementById("chk_mute").checked
	document.querySelectorAll("#audio > input[type='button']").forEach((btn) => {
		btn.disabled = muted
	})
}

/**
 * Go to given screen
 * @param {string} screen - Screen name
 * @returns {void}
 */
function goto_screen(screen) {
	const changes = { screen: screen }

	// save changes from settings screen
	if (screen == "rounds") {
		changes["teams.0.name"] = document.getElementById("txt_name_0").value
		changes["teams.1.name"] = document.getElementById("txt_name_1").value
	}

	state.commit_changes(changes)
}

/**
 * Answer was clicked
 * @param {number} idx_a - Answer index
 * @returns {void}
 */
function right_answer_given(idx_a) {
	const changes = {}
	const current_state = state.get_consolidated()
	const idx_r = current_state["round.id"]

	// show answer
	let setting = "round.answers_shown." + idx_a
	changes[setting] = idx_r

	// add points
	setting = "round.points"
	const round_points = current_state[setting]
	const answer_points = answers_rounds[idx_r][idx_a][1]
	changes[setting] = round_points + answer_points * multiplicator[idx_r]

	state.commit_changes(changes)

	play_sound("yeah")
}

/**
 * Team gave wrong answer
 * @param {number} team - Team index (0 or 1)
 * @returns {void}
 */
function wrong_answer_given(team) {
	const changes = {}
	const setting = "teams." + team + ".misses"
	changes[setting] = state.get_consolidated()[setting] + 1
	state.commit_changes(changes)

	play_sound("buh")
}

/**
 * Given team has won the current round
 * @param {number} team - Team index (0 or 1)
 * @returns {void}
 */
function team_won_round(team) {
	const changes = {}
	const setting = "teams." + team + ".points"

	const current_state = state.get_consolidated()
	const round_points = current_state["round.points"]
	const team_points = current_state[setting]

	changes[setting] = team_points + round_points
	changes["round.finished"] = true
	state.commit_changes(changes)

	play_sound("yeah")
}

/**
 * Start next round
 * @returns {void}
 */
function goto_next_round() {
	const changes = {}
	const current_state = state.get_consolidated()

	changes["round.id"] = current_state["round.id"] + 1
	changes["round.points"] = 0
	changes["round.finished"] = false

	for (let a = 0; a < max_answers; a++) {
		changes["round.answers_shown." + a] = -1
	}

	changes["teams.0.misses"] = 0
	changes["teams.1.misses"] = 0
	state.commit_changes(changes)
}

/**
 * Finals: an answer is chosen or typed in
 * @param {number} player - Player index
 * @param {number} question - Question index
 * @returns {void}
 */
function finals_answer_changed(player, question) {
	const right_answer = document.getElementById(
		"finals_answers_p" + player + "_" + question
	).value
	const wrong_answer = document.getElementById(
		"finals_wrong_answer_p" + player + "_" + question
	).value
	let answer

	// answer is chosen from dropdown
	if (right_answer >= 0) answer = parseInt(right_answer)
	// answer is typed in
	else if (wrong_answer != "") answer = wrong_answer
	// no answer is given
	else answer = -1

	let changes = {}
	changes["finals.answers." + player + "." + question + ".id"] = answer

	// re-calculate points
	changes = finals_recalc_points(changes)

	state.commit_changes(changes)
}

/**
 * Finals: answer should be shown/hidden
 * @param {number} player - Player index
 * @param {number} question - Question index
 * @returns {void}
 */
function finals_show_answer(player, question) {
	const shown = document.getElementById(
		"finals_answer_visible_p" + player + "_" + question
	).checked
	const changes = {}

	changes["finals.answers." + player + "." + question + ".answer_shown"] = shown
	state.commit_changes(changes)
}

/**
 * Finals: points should be shown/hidden
 * @param {number} player - Player index
 * @param {number} question - Question index
 * @returns {void}
 */
function finals_show_points(player, question) {
	const current_state = state.get_consolidated()
	let changes = {}

	// show/hide points
	const shown = document.getElementById(
		"finals_points_visible_p" + player + "_" + question
	).checked
	changes["finals.answers." + player + "." + question + ".points_shown"] = shown

	// re-calculate points
	changes = finals_recalc_points(changes)

	state.commit_changes(changes)

	if (shown) {
		if (
			typeof current_state[
				"finals.answers." + player + "." + question + ".id"
			] == "string"
		) {
			play_sound("boo")
		} else {
			play_sound("yeah")
		}
	}
}
