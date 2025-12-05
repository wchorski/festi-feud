/**
 * @typedef {import("types/GameState.js").GameState} GameState
 * @typedef {import("types/GameState.js").Team} Team
 * @typedef {import("types/BroadcastChannels").BC_GAME_MESSAGE} BC_GAME_MESSAGE
 * @typedef {import("types/BroadcastChannels").BC_TEAM_UPDATE_DETAIL} BC_TEAM_UPDATE_DETAIL
 * @typedef {import("types/BroadcastChannels").BC_UPDATE_POINTS_DETAIL} BC_UPDATE_POINTS_DETAIL
 * @typedef {import("types/BroadcastChannels").BC_SET_STRIKES_DETAIL} BC_SET_STRIKES_DETAIL
 * @typedef {import("types/BroadcastChannels").BC_TEAM_ACTIVE_DETAIL} BC_TEAM_ACTIVE_DETAIL
 * @typedef {import("types/BroadcastChannels").BC_END_ROUND_DETAIL} BC_END_ROUND_DETAIL
 * @typedef {import("types/BroadcastChannels").BC_END_GAME_DETAIL} BC_END_GAME_DETAIL
 * @typedef {import("types/BroadcastChannels").BC_GAME_LOAD_DETAIL} BC_GAME_LOAD_DETAIL
 */
import {
	elGameAnswerForPopup,
	getElementById,
	querySelector,
	querySelectorAll,
} from "../components.js"
import { CHANNEL_TYPES, events, gameChannel } from "../utils/events.js"
import { gameStateManager } from "../utils/gameState.js"
const teamsWrapEl = getElementById("teams", HTMLDivElement)
const gameWinnerNameEl = getElementById("game-winner-name", HTMLElement)
const roundScoreEl = getElementById("round-score", HTMLElement)
const roundTypeEl = getElementById("round-type", HTMLElement)
const roundPhaseEl = getElementById("round-phase", HTMLElement)
const gameRoundEl = getElementById("game-round", HTMLElement)
const answersList = getElementById("answers", HTMLDListElement)
const questionEl = getElementById("question", HTMLParagraphElement)

document.addEventListener("DOMContentLoaded", function () {
	initUi(gameStateManager.get())
	reactiveEvents()
})

/** @param {GameState} state  */
function initUi(state) {
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
	} = state

	teamsWrapEl.dataset.activeTeamIndex = String(activeTeamIndex)

	const answerEls = answers.map((a) => elGameAnswerForPopup(a))
	answersList.replaceChildren(...answerEls)

	gameRoundEl.textContent = String(round)
	document.body.dataset.roundPhase = roundPhase
	roundPhaseEl.textContent = roundPhase
	document.body.dataset.roundType = roundType
	roundTypeEl.textContent = roundType
	questionEl.innerText = question?.text || "QUESTION_NOT_FOUND"
	roundSteal
		? teamsWrapEl.classList.add("round-steal")
		: teamsWrapEl.classList.remove("round-steal")
	roundScoreEl.textContent = String(points)

	teams.forEach((team, i) => {
		uiTeamUpdate(i, team)
	})
}

/**
 * @param {number} i
 * @param {Partial<Team>} team
 */
function uiTeamUpdate(i, team) {
	const teamWrapEl = document.getElementById(`team-${i}`)
	if (!teamWrapEl) throw new Error("no teamWrapEl")

	if (team.name) {
		const h2 = teamWrapEl.querySelector("h2")
		if (!(h2 instanceof HTMLHeadingElement))
			throw new Error(`team-${i} h2 not found`)
		h2.textContent = team.name || `Team ${i}`
	}

	if (team.score !== undefined) {
		const pointsEl = teamWrapEl.querySelector(".points")
		if (!(pointsEl instanceof HTMLSpanElement))
			throw new Error(`team ${i} span.points not found`)
		pointsEl.textContent = String(team.score)
	}
}

function reactiveEvents() {
	// const onTeamRename = /** @type {EventListener} */ (
	// 	/** @param {CustomEvent<TeamRenamedDetail>} e */
	// 	(e) => {
	// 		const { oldName, newName, teamIndex: i } = e.detail

	// 		uiTeamUpdate(i, { name: newName })
	// 	}
	// )

	/** @param {BC_TEAM_ACTIVE_DETAIL} detail  */
	function onActiveTeamSwitch(detail) {
		const { nextTeamIndex, prevTeamIndex, isBuzzersActive } = detail
		teamsWrapEl.dataset.activeTeamIndex = String(nextTeamIndex)
	}

	/** @param {BC_SET_STRIKES_DETAIL} detail  */
	function onSetStrikes(detail) {
		const { strikes, roundSteal } = detail

		const strikesWrap = getElementById("strikes", HTMLDivElement)
		const strikeSVGs = querySelectorAll("svg.strike", SVGElement, strikesWrap)
		strikeSVGs.forEach((svg, i) => {
			i + 1 <= strikes
				? (svg.dataset.disabled = "false")
				: (svg.dataset.disabled = "true")
		})

		roundSteal
			? teamsWrapEl.classList.add("round-steal")
			: teamsWrapEl.classList.remove("round-steal")
	}

	/** @param {BC_END_GAME_DETAIL} detail  */
	function onGameEnd(detail) {
		const { state, highestScoringTeam } = detail
		document.body.dataset.roundPhase = state.roundPhase
		document.body.dataset.roundType = state.roundType
		gameWinnerNameEl.textContent = highestScoringTeam.name
	}

	/** @param {BC_UPDATE_POINTS_DETAIL} detail  */
	function onIsGuessed(detail) {
		const { prevPoints, currentPoints, roundPhase, updatedAnswer } = detail
		if (roundPhase !== "end") roundScoreEl.textContent = String(currentPoints)
		const gameAnswerEl = getElementById(
			`gameanswer-${updatedAnswer.id}`,
			HTMLElement
		)
		updatedAnswer.isGuessed
			? gameAnswerEl.classList.add("checked")
			: gameAnswerEl.classList.remove("checked")
	}

	/** @param {BC_END_ROUND_DETAIL} detail  */
	function onEndRound(detail) {
		const { state } = detail
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

		document.body.dataset.roundType = state.roundType
		document.body.dataset.roundPhase = state.roundPhase
		// TODO move to onEndGame
		// if (state.roundType === "conclusion") {
		// 	gameWinnerNameEl.textContent = state.teams[0].name
		// }
	}

	/** @param {BC_GAME_LOAD_DETAIL} detail  */
	function onGameLoad(detail) {
		const { state } = detail
		console.log("onGameLoad: ", state)
		initUi(state)
	}

	gameChannel.addEventListener(
		"message",
		/** @param {MessageEvent<BC_GAME_MESSAGE>} event */
		(event) => {
			// const message = /** @type {MessageEvent<BC_UPDATE_POINTS>} */ (event)
			// /** @type {BC_TYPE} */
			// const type = event.data.type
			// const detail = event.data.detail

			const { type, detail } = event.data

			switch (type) {
				case CHANNEL_TYPES.UPDATE_POINTS:
					onIsGuessed(detail)
					break
				case CHANNEL_TYPES.TEAM_UPDATE:
					/** @type {Extract<BC_GAME_MESSAGE, { type: "game:teamUpdate" }>["detail"]} */
					const { index, teamUpdate } = detail
					uiTeamUpdate(index, teamUpdate)
					break
				case CHANNEL_TYPES.SET_STRIKES:
					onSetStrikes(detail)
					break
				case CHANNEL_TYPES.TEAM_ACTIVE:
					onActiveTeamSwitch(detail)
					break
				case CHANNEL_TYPES.END_ROUND:
					onEndRound(detail)
					break
				case CHANNEL_TYPES.END_GAME:
					onGameEnd(detail)
					break
				case CHANNEL_TYPES.GAME_LOAD:
					onGameLoad(detail)
					break

				default:
					break
			}
		}
	)
}

// TODO move this to /ui.js
/** @param {GameState} state  */
function uiUpdateScores(state) {
	const { teams } = state
	teams.forEach((team, i) => {
		const scoreEl = getElementById(`team-${i}-score`, HTMLSpanElement)

		scoreEl.textContent = String(team.score)
	})
}
