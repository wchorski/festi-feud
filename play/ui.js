/**
 * @typedef {import("types/EventDetails").TeamRenamedDetail} TeamRenamedDetail
 * @typedef {import("types/EventDetails").StrikesSetDetail} StrikesSetDetail
 * @typedef {import("types/EventDetails").ActiveTeamDetail} ActiveTeamDetail
 * @typedef {import("types/EventDetails").SetPointsDetail} SetPointsDetail
 * @typedef {import("types/EventDetails").RoundEndedDetail} RoundEndedDetail
 * @typedef {import("types/EventDetails").RoundPhaseDetail} RoundPhaseDetail
 * @typedef {import("types/EventDetails").GameWinnerDetail} GameWinnerDetail
 * @typedef {import("types/GameState.js").GameState} GameState
 * @typedef {import("types/GameState.js").Team} Team
 * @typedef {import("types/BroadcastChannels").BC_TYPE} BC_TYPE
 * @typedef {import("types/BroadcastChannels").BC_TEAM_UPDATE} BC_TEAM_UPDATE
 */

import {
	elGameAnswerModerator,
	getElementById,
	querySelector,
} from "../components.js"
import {
	events,
	EVENT_TYPES,
	// CHANNEL_TYPES,
	// gameChannel,
} from "../utils/events.js"
import { gameStateManager } from "../utils/gameState.js"

const { TEAM_ACTIVE, TEAM_RENAME, TEAM_UPDATE } = EVENT_TYPES

/** @type {Window | null} */
let popupWindow = null
const answersList = getElementById("answers", HTMLDListElement)
const questionEl = getElementById("question", HTMLParagraphElement)
const team0ActiveCheckbox = getElementById("team-0-active", HTMLInputElement)
const team1ActiveCheckbox = getElementById("team-1-active", HTMLInputElement)
const roundStealCheckbox = getElementById("round-steal", HTMLInputElement)
// const gameRoundNumInput = querySelector('input[name="round"]', HTMLInputElement)
const strikesWrap = getElementById("game-strikes", HTMLDivElement)
/** @type {NodeListOf<HTMLInputElement>} */
const strikeCheckboxes = strikesWrap.querySelectorAll('input[type="checkbox"]')
if (!strikeCheckboxes) throw new Error("no strikeCheckboxes")
const endRoundBtn = getElementById("end-round", HTMLButtonElement)
const resetGameBtn = getElementById("rest-game", HTMLButtonElement)
const nextRoundDetailsEl = getElementById(
	"next-round-options",
	HTMLDetailsElement
)

const teamsWrapEl = getElementById("teams", HTMLDivElement)
const roundScoreEl = getElementById("round-score", HTMLElement)
const scoreMultiEl = getElementById("score-multiplier", HTMLElement)
const gameRoundEl = getElementById("game-round", HTMLSpanElement)
const roundPhaseEl = getElementById("round-phase", HTMLSpanElement)
const roundTypeEl = getElementById("round-type", HTMLElement)
const buzzersActiveEl = getElementById("buzzers-active", HTMLElement)
const gameWinnerNameEl = getElementById("game-winner-name", HTMLElement)
// const gameRoundInput = querySelector('input[name="round"', HTMLInputElement)

export function uiInit() {
	const {
		activeTeamIndex,
		answers,
		pointMultiplier,
		points,
		question,
		round,
		roundSteal,
		isBuzzersActive,
		roundPhase,
		roundType,
		strikes,
		teams,
	} = gameStateManager.get()

	teamsWrapEl.dataset.activeTeamIndex = String(activeTeamIndex)
	if (activeTeamIndex === 0) team0ActiveCheckbox.checked = true
	if (activeTeamIndex === 1) team1ActiveCheckbox.checked = true
	const answerEls = answers.map((a) =>
		elGameAnswerModerator(a, (checked) => {
			gameStateManager.setIsGuessed(a.id, checked)
			if (roundPhase !== "end") {
				roundScoreEl.textContent = String(gameStateManager.totalPoints)
			}
		})
	)
	answersList.replaceChildren(...answerEls)
	scoreMultiEl.textContent = "x" + String(pointMultiplier)
	roundScoreEl.textContent = String(points)
	questionEl.innerText = question?.text || "QUESTION_NOT_FOUND"
	// gameRoundInput.value = String(round)
	gameRoundEl.textContent = String(round)
	// state.roundSteal
	roundTypeEl.textContent = roundType
	document.body.dataset.roundType = roundType
	gameRoundEl.textContent = String(round)
	buzzersActiveEl.textContent = String(isBuzzersActive)
	buzzersActiveEl.className = String(isBuzzersActive)
	roundPhaseEl.textContent = roundPhase
	document.body.dataset.roundPhase = roundPhase
	if (roundType === "conclusion") {
		gameWinnerNameEl.textContent = teams.sort(
			(a, b) => b.score - a.score
		)[0].name
	}
	// state.strikes
	teams.forEach((team, i) => {
		uiTeamUpdate(i, team)
	})
}

/**
 * @param {number} i
 * @param {Partial<Team>} team
 */
function uiTeamUpdate(i, team) {
	// TODO move all popup ui to it's own file. subscribe to same event dispatch
	// if (!popupWindow || popupWindow.closed) {
	// 	// TODO add back in for moderator
	// 	console.log("Popup is not open!")
	// 	// alert("Popup is not open!")
	// 	// return
	// }
	const teamWrapEl = document.getElementById(`team-${i}`)
	if (!teamWrapEl) throw new Error("no teamWrapEl")

	const h2 = teamWrapEl.querySelector("h2")
	if (!(h2 instanceof HTMLHeadingElement))
		throw new Error(`team-${i} h2 not found`)
	h2.textContent = team.name || `Team ${i}`

	// const nameInput = teamWrapEl.querySelector(`input[name="team-${i}-name"]`)
	// if (!(nameInput instanceof HTMLInputElement))
	// 	throw new Error(`input team-${i}-name not found`)
	// if (team.name) nameInput.value = team.name

	const pointsInput = teamWrapEl.querySelector(`input[name="team-${i}-points"]`)
	if (!(pointsInput instanceof HTMLInputElement))
		throw new Error(`input team-${i}-name not found`)
	if (team.score) pointsInput.value = String(team.score)
}

document.addEventListener("DOMContentLoaded", function () {
	const openBtn = getElementById("btn_open_win", HTMLButtonElement)
	const closeBtn = getElementById("btn_close_win", HTMLButtonElement)

	function openPopup() {
		const features =
			"width=600,height=800,left=100,top=100,menubar=no,toolbar=no,location=no,status=no,scrollbars=yes"

		// Open the popup with the external HTML file
		popupWindow = window.open("popup.html", "PopupWindow", features)

		if (popupWindow) {
			openBtn.disabled = true
			closeBtn.disabled = false

			// Check if popup is closed
			const checkClosed = setInterval(() => {
				if (popupWindow && popupWindow.closed) {
					clearInterval(checkClosed)
					handlePopupClosed()
				}
			}, 500)
		}
	}

	function closePopup() {
		if (popupWindow && !popupWindow.closed) {
			popupWindow.close()
		}
		handlePopupClosed()
	}

	function handlePopupClosed() {
		popupWindow = null
		openBtn.disabled = false
		closeBtn.disabled = true
	}

	// /** @param {number} points  */
	// function uiPointsDisplay(points) {
	// 	roundScoreEl.textContent = String(points)
	// }

	// /** @param {{nextTeamIndex: number, prevTeamIndex:number}} detail  */
	// function onActiveTeamSwitch(detail) {
	// 	const { nextTeamIndex, prevTeamIndex } = detail

	// 	uiActiveTeamCheckboxToggles(nextTeamIndex)
	// 	nextTeamIndex === undefined
	// 		? uiToggleCheckboxDisables(true)
	// 		: uiToggleCheckboxDisables(false)

	// 	// uiActiveTeam(prevTeamIndex, nextTeamIndex, popupWindow)
	// 	// TODO isn't popup related but... lazy
	// 	uiActiveTeam(prevTeamIndex, nextTeamIndex, window)
	// }

	// const onTeamRename = /** @type {EventListener} */ (
	// 	/** @param {CustomEvent<TeamRenamedDetail>} e */
	// 	(e) => {
	// 		const { oldName, newName, teamIndex } = e.detail
	// 		// TODO make this accept whole team object instead
	// 		uiTeamUpdate(teamIndex, { name: newName })
	// 	}
	// )

	// const onIsGuessed = /** @type {EventListener} */ (
	// 	/** @param {CustomEvent<SetPointsDetail>} e */
	// 	(e) => {
	// 		const { prevPoints, currentPoints, roundPhase } = e.detail
	// 		if (roundPhase !== "end") uiPointsDisplay(currentPoints)
	// 	}
	// )

	const onStrikeSet = /** @type {EventListener} */ (
		/** @param {CustomEvent<StrikesSetDetail>} e */
		(e) => {
			const { strikes, roundSteal } = e.detail

			roundStealCheckbox.checked = roundSteal
			roundSteal
				? teamsWrapEl.classList.add("round-steal")
				: teamsWrapEl.classList.remove("round-steal")
		}
	)

	// const onRoundStealSet = /** @type {EventListener} */ (
	// 	/** @param {CustomEvent<StrikesSetDetail>} e */
	// 	(e) => {
	// 		const { roundSteal } = e.detail
	// 		roundStealCheckbox.checked = roundSteal
	// 		roundSteal
	// 			? teamsWrap.classList.add("round-steal")
	// 			: teamsWrap.classList.remove("round-steal")
	// 		// console.log({ state })
	// 		// uiPointsDisplay(currentPoints)
	// 	}
	// )

	const onRoundEnded = /** @type {EventListener} */ (
		/** @param {CustomEvent<RoundEndedDetail>} e */
		(e) => {
			const { state } = e.detail
			uiUpdateScores(state)
			console.log("disabled strikes, round steal. turn on winner badge")
			const { activeTeamIndex, roundSteal, teams } = state
			if (activeTeamIndex === undefined)
				throw new Error("activeTeamIndex is undefined")

			const teamStealIndex = (activeTeamIndex + 1) % teams.length
			const winningTeamIndex = roundSteal ? teamStealIndex : activeTeamIndex

			const winningTeamEl = getElementById(
				`team-${winningTeamIndex}`,
				HTMLElement
			)
			winningTeamEl.classList.add("winner")
		}
	)

	// const onRoundNext = /** @type {EventListener} */ (
	// 	/** @param {CustomEvent<RoundEndedDetail>} e */
	// 	(e) => {
	// 		//
	// 		const { state } = e.detail
	// 		console.log("onRoundNext")
	// 		// TODO maybe i also add event listener in ./page.js to handle data, then trigger ui stuff
	// 	}
	// )
	const onRoundEnd = /** @type {EventListener} */ (
		/** @param {CustomEvent<RoundEndedDetail>} e */
		(e) => {
			// TODO do i really need to send whole state in this event?
			const { state } = e.detail
			console.log("onRoundNext")
			document.body.dataset.roundType = state.roundType
			document.body.dataset.roundPhase = state.roundPhase
			if (!(state.roundType === "conclusion")) {
				nextRoundDetailsEl.open = true
			}
		}
	)

	const onRoundPhase = /** @type {EventListener} */ (
		/** @param {CustomEvent<RoundPhaseDetail>} e */
		(e) => {
			//
			const { roundPhase } = e.detail
			document.body.dataset.roundPhase = roundPhase
		}
	)

	// const onActiveTeamId = /** @type {EventListener} */ (
	// 	/** @param {CustomEvent<ActiveTeamDetail>} e */
	// 	(e) => {
	// 		const { nextTeamIndex, prevTeamIndex, isBuzzersActive } = e.detail
	// 		buzzersActiveEl.className = String(isBuzzersActive)
	// 		buzzersActiveEl.textContent = String(isBuzzersActive)
	// 	}
	// )

	const onGameWinner = /** @type {EventListener} */ (
		/** @param {CustomEvent<GameWinnerDetail>} e */
		(e) => {
			const { state, highestScoringTeam } = e.detail
			document.body.dataset.roundPhase = state.roundPhase
			document.body.dataset.roundType = state.roundType
			gameWinnerNameEl.textContent = highestScoringTeam.name
		}
	)

	//! does not react if emitted from same browser window
	// gameChannel.addEventListener("message", (event) => {
	// 	/** @type {BC_TYPE} */
	// 	const type = event.data.type
	// 	const detail = event.data.detail
	// 	console.log({ type, detail })

	// 	switch (type) {
	// 		case CHANNEL_TYPES.UPDATE_POINTS:
	// 			console.log("CHANNEL_TYPES.UPDATE_POINTS")

	// 			break
	// 		case CHANNEL_TYPES.TEAM_UPDATE:
	// 			console.log("CHANNEL_TYPES.TEAM_UPDATE")
	// 			/** @type {BC_TEAM_UPDATE['detail']} */
	// 			const { index, teamUpdate } = event.data.detail
	// 			uiTeamUpdate(index, teamUpdate)
	// 			break

	// 		default:
	// 			break
	// 	}
	// })

	// listeners
	openBtn.addEventListener("pointerup", openPopup)
	closeBtn.addEventListener("pointerup", closePopup)
	// events.addEventListener(TEAM_RENAME, onTeamRename)
	// events.addEventListener(TEAM_ACTIVE, onActiveTeamSwitch)
	// events.addEventListener(EVENT_TYPES.UPDATE_POINTS, onIsGuessed)
	events.addEventListener(EVENT_TYPES.AWARD_POINTS, onRoundEnded)
	events.addEventListener(EVENT_TYPES.SET_STRIKES, onStrikeSet)
	// TODO don't need below line if above line works
	// events.addEventListener(EVENT_TYPES.ROUNDSTEAL_SET, onRoundStealSet)
	// events.addEventListener(EVENT_TYPES.NEXT_ROUND, onRoundNext)
	// TODO combine with `onRoundEnded`
	events.addEventListener(EVENT_TYPES.END_ROUND, onRoundEnd)
	events.addEventListener(EVENT_TYPES.SET_ROUNDPHASE, onRoundPhase)
	// // TODO can't i combine below with `onActiveTeamSwitch`?
	// events.addEventListener(EVENT_TYPES.TEAM_ACTIVE, onActiveTeamId)
	events.addEventListener(EVENT_TYPES.GAME_WINNER, onGameWinner)

	setupTeamControls()
	setupGameControls()
})

function setupGameControls() {
	// TODO do i gotta get the whole state manager?
	const { activeTeamIndex } = gameStateManager.get()

	if (activeTeamIndex !== undefined) {
		strikeCheckboxes.forEach((box) => {
			box.disabled = false
		})
		roundStealCheckbox.disabled = false
	}

	strikesWrap.addEventListener("change", () => {
		const activeTeamIndex = gameStateManager.get().activeTeamIndex

		const checkedCount = Array.from(strikeCheckboxes).filter(
			(cb) => cb.checked
		).length
		gameStateManager.setStrikes(checkedCount)

		if (activeTeamIndex === undefined) {
			strikeCheckboxes.forEach((box) => {
				box.checked = false
				box.disabled = true
			})
		}

		// TODO don't disable and renable on timer. let moderator choose when to end round or fix game state before awarding points
		// TODO could change this over to dispatch listener for ui only script
		// if (checkedCount === 3) {
		// 	strikeCheckboxes.forEach((box) => {
		// 		box.disabled = true
		// 	})
		// 	setTimeout(() => {
		// 		strikeCheckboxes?.forEach((box) => {
		// 			box.checked = false
		// 			box.disabled = false
		// 		})
		// 	}, 3000)
		// }
	})

	roundStealCheckbox.addEventListener("change", (e) => {
		if (!(e.target instanceof HTMLInputElement))
			throw new Error("not an input el")
		gameStateManager.setRoundSteal(e.target.checked)
	})

	// gameRoundNumInput.addEventListener("change", (e) => {
	// 	if (!(e.target instanceof HTMLInputElement))
	// 		throw new Error("not an input el")
	// 	gameStateManager.set({ round: Number(e.target.value) })
	// })

	endRoundBtn.onclick = (e) => {
		// gameStateManager.awardPoints()
		gameStateManager.endRound()
	}
	resetGameBtn.onclick = (e) => {
		gameStateManager.reset()
		window.location.href = "/"
	}
}

function setupTeamControls() {
	const team0NameInput = getElementById("team-0-name", HTMLInputElement)
	const team1NameInput = getElementById("team-1-name", HTMLInputElement)
	const team0PointsInput = getElementById("team-0-points", HTMLInputElement)
	const team1PointsInput = getElementById("team-1-points", HTMLInputElement)

	team0NameInput.oninput = (e) => {
		if (!(e.target instanceof HTMLInputElement))
			throw new Error("not an input el")
		gameStateManager.updateTeam(0, { name: e.target.value })
		uiTeamUpdate(0, { name: e.target.value })
	}

	team1NameInput.oninput = (e) => {
		if (!(e.target instanceof HTMLInputElement))
			throw new Error("not an input el")
		gameStateManager.setTeamName(1, e.target.value)
	}

	team0PointsInput.oninput = (e) => {
		if (!(e.target instanceof HTMLInputElement))
			throw new Error("not an input el")
		gameStateManager.updateTeam(0, { score: Number(e.target.value) })
	}
	team1PointsInput.oninput = (e) => {
		if (!(e.target instanceof HTMLInputElement))
			throw new Error("not an input el")
		gameStateManager.updateTeam(1, { score: Number(e.target.value) })
	}

	team0ActiveCheckbox.oninput = (e) => {
		if (!(e.target instanceof HTMLInputElement))
			throw new Error("not an input el")

		teamsWrapEl.dataset.activeTeamIndex = String(
			e.target.checked ? 0 : undefined
		)

		gameStateManager.setActiveTeam(e.target.checked ? 0 : undefined)
	}

	team1ActiveCheckbox.oninput = (e) => {
		if (!(e.target instanceof HTMLInputElement))
			throw new Error("not an input el")

		teamsWrapEl.dataset.activeTeamIndex = String(
			e.target.checked ? 1 : undefined
		)

		gameStateManager.setActiveTeam(e.target.checked ? 1 : undefined)
	}
}

/** @param {number} teamIndex  */
function uiActiveTeamCheckboxToggles(teamIndex) {
	if (teamIndex === 0) {
		team0ActiveCheckbox.checked = true
		team1ActiveCheckbox.checked = false
	} else if (teamIndex === 1) {
		team0ActiveCheckbox.checked = false
		team1ActiveCheckbox.checked = true
	}
	// else {
	// 	throw new Error(`team index ${teamIndex} does not exist`)
	// }
}

/** @param {boolean} disabled  */
export function uiToggleCheckboxDisables(disabled) {
	strikeCheckboxes?.forEach((box) => {
		box.disabled = disabled
	})
	roundStealCheckbox.disabled = disabled
}
// TODO move this to /ui.js
/** @param {GameState} state  */
function uiUpdateScores(state) {
	// console.log({ state })
	const { teams } = state
	teams.forEach((team, i) => {
		const scoreEl = querySelector(
			`input[name="team-${i}-points]`,
			HTMLInputElement
		)

		scoreEl.value = String(team.score)
	})
}
