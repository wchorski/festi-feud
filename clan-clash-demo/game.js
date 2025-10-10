import { answers_finals, answers_rounds } from "../questions-demo.js"

/**
 * Maximum number of answers per question
 * @type {number}
 */
let max_answers = 0

/**
 * Tasks to be run after DOM is fully loaded
 * @listens DOMContentLoaded
 */
document.addEventListener("DOMContentLoaded", function () {
	// calculate maximum number of answers per round
	answers_rounds.forEach((answers) => {
		if (answers.length > max_answers) max_answers = answers.length
	})

	// initialize answer table for rounds
	const tbl_rounds_answers = document.getElementById("tbl_rounds_answers")
	if (!tbl_rounds_answers) throw new Error("!tbl_rounds_answers")
	for (let i = 0; i < max_answers; i++) {
		const row = document.createElement("tr")
		row.id = "answer_row" + i
		row.innerHTML =
			'<td class="answer_priority">' +
			(i + 1) +
			".</td>" +
			'<td class="answer"><span id="answer' +
			i +
			'" class="answer_span">&nbsp;</span></td>' +
			'<td class="answer_points" id="points' +
			i +
			'"></td>'
		tbl_rounds_answers.appendChild(row)
	}

	// initialize answer table for finals
	const tbl_finals_answers = document.getElementById("tbl_finals_answers")
	if (!tbl_finals_answers) throw new Error("!tbl_finals_answers")
	for (let i = 0; i < answers_finals.length; i++) {
		const row = document.createElement("tr")
		row.innerHTML =
			'<td class="answer"><span id="finals_answer' +
			i +
			'-0"></span><span id="finals_answer' +
			i +
			'-0-empty">&nbsp;</span></td>' +
			'<td class="answer_points"><span id="finals_points' +
			i +
			'-0"></span><span id="finals_points' +
			i +
			'-0-empty">&nbsp;</span></td>' +
			'<td class="answer_points"><span id="finals_points' +
			i +
			'-1"></span><span id="finals_points' +
			i +
			'-1-empty">&nbsp;</span></td>' +
			'<td class="answer"><span id="finals_answer' +
			i +
			'-1"></span><span id="finals_answer' +
			i +
			'-1-empty">&nbsp;</span></td>'
		tbl_finals_answers.appendChild(row)
	}

	// notify control window
	window.opener.game_window_init_done()
})

/**
 * Tasks to be run when window is closed
 * @param {Event} e - Before unload event
 */
window.onbeforeunload = function (e) {
	// notify control window
	window.opener.game_window_closed()
}

/**
 * Contains change handlers for the game window
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
				document.getElementById("name_t" + team).textContent = value
				break

			case "points":
				// set team points
				document.getElementById("team" + team + "_points").textContent = value
				break

			case "misses":
				// set team misses
				for (let i = 0; i < 3; i++) {
					const text = i < value ? "X" : "&nbsp;"
					document.getElementById("x_t" + team + "_" + i).innerHTML = text
				}
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
				// switch to round
				document.getElementById("round_display").textContent = value + 1

				// update multiplicator
				if (multiplicator[value] > 1) {
					document.getElementById("multiplicator_display").textContent =
						"(" + multiplicator[value] + "x)"
				} else {
					document.getElementById("multiplicator_display").innerHTML = ""
				}

				// set length of answers table
				document.querySelectorAll("#tbl_rounds_answers td").forEach((td) => {
					td.classList.add("invisible")
				})

				for (let a = 0; a < answers_rounds[value].length; a++) {
					document.querySelectorAll("#answer_row" + a + " td").forEach((td) => {
						td.classList.remove("invisible")
					})
				}
				break

			case "points":
				// set round points
				document.getElementById("round_points").textContent = value
				break

			case "answers_shown":
				const idx_answer = args.shift()

				// show/hide answer
				let text
				let points

				if (value >= 0) {
					const answer = answers_rounds[value][idx_answer]
					text = answer[0]
					points = answer[1]
				} else {
					text = "&nbsp;"
					points = "&nbsp;"
				}

				// rollin effect
				const answerEl = document.getElementById("answer" + idx_answer)
				if (!answerEl) throw new Error("!answerEl")
				answerEl.style.width = "0%"
				answerEl.innerHTML = text

				// Animate width (vanilla JS animation)
				let width = 0
				const interval = setInterval(() => {
					if (width >= 100) {
						clearInterval(interval)
					} else {
						width += 10
						answerEl.style.width = width + "%"
					}
				}, 50)

				document.getElementById("points" + idx_answer).innerHTML = points
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
			case "points":
				// set points
				document.getElementById("finals_points").textContent = value
				break

			case "answers":
				// configure answers display
				const player = args.shift()
				const idx_question = args.shift()
				const setting2 = args.shift()

				switch (setting2) {
					case "id":
						// set answer text and points
						let text
						let points

						// wrong answer (given as string)
						if (typeof value == "string") {
							text = value
							points = "--"

							// no answer given (yet)
						} else if (value < 0) {
							text = ""
							points = ""

							// correct answer given (as index)
						} else {
							const answer = answers_finals[idx_question][value]
							text = answer[0]
							points = answer[1]
						}

						document.getElementById(
							"finals_answer" + idx_question + "-" + player
						).textContent = text
						document.getElementById(
							"finals_points" + idx_question + "-" + player
						).textContent = points
						break

					case "answer_shown":
						// show/hide answer
						const answerEl = document.getElementById(
							"finals_answer" + idx_question + "-" + player
						)
						if (!answerEl) throw new Error("!answerEl")
						answerEl.style.display = value ? "" : "none"
						const answerEmptyEl = document.getElementById(
							"finals_answer" + idx_question + "-" + player + "-empty"
						)
						if (!answerEmptyEl) throw new Error("!answerEmptyEl")
						answerEmptyEl.style.display = value ? "none" : ""
						break

					case "points_shown":
						// show/hide points
						const pointsEl = document.getElementById(
							"finals_points" + idx_question + "-" + player
						)
						if (!pointsEl) throw new Error("!pointsEl")
						pointsEl.style.display = value ? "" : "none"
						const pointsEmptyEl = document.getElementById(
							"finals_points" + idx_question + "-" + player + "-empty"
						)
						if (!pointsEmptyEl) throw new Error("!pointsEmptyEl")
						pointsEmptyEl.style.display = value ? "none" : ""
						break
				}
				break
		}
	},
}

// ##### start of API (to be called from control window) #####

/**
 * Apply changes to game window
 * @param {Object.<string, any>} changes - Changes to apply
 * @returns {void}
 */
export function apply_changes(changes) {
	Object.entries(changes).forEach(([setting, value]) => {
		const args = setting.split(".")
		const toplevel = args.shift()

		state_changer[toplevel](args, value)
	})
}

/**
 * Set timer value
 * @param {number} timeleft - Time left in seconds
 * @returns {void}
 */
function set_timer(timeleft) {
	document.getElementById("timeleft").textContent = timeleft
}

// ##### end of API (to be called from control window) #####
