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
 * @typedef {import("types/BroadcastChannels").BC_UPDATE_POINTS} BC_UPDATE_POINTS
 * @typedef {import("types/BroadcastChannels").BC_TYPE} BC_TYPE
 * @typedef {import("types/BroadcastChannels").BC_TEAM_UPDATE} BC_TEAM_UPDATE
 * @typedef {import("types/BroadcastChannels").BC_SET_STRIKES} BC_SET_STRIKES
 * @typedef {import("types/BroadcastChannels").BC_TEAM_ACTIVE} BC_TEAM_ACTIVE
 */
import {
	elGameAnswerForPopup,
	getElementById,
	querySelector,
	querySelectorAll,
} from "../components.js"
import {
	CHANNEL_TYPES,
	EVENT_TYPES,
	events,
	gameChannel,
} from "../utils/events.js"
import { gameStateManager } from "../utils/gameState.js"
const { TEAM_ACTIVE, TEAM_RENAME } = EVENT_TYPES
const teamsWrapEl = getElementById("teams", HTMLDivElement)
const gameWinnerNameEl = getElementById("game-winner-name", HTMLElement)
const roundScoreEl = getElementById("round-score", HTMLElement)
const answersList = getElementById("answers", HTMLDListElement)
const questionEl = getElementById("question", HTMLParagraphElement)

document.addEventListener("DOMContentLoaded", function () {
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

	const answerEls = answers.map((a) => elGameAnswerForPopup(a))
	answersList.replaceChildren(...answerEls)

	document.body.dataset.roundPhase = roundPhase
	document.body.dataset.roundType = roundType
	questionEl.innerText = question?.text || "QUESTION_NOT_FOUND"
	roundSteal
		? teamsWrapEl.classList.add("round-steal")
		: teamsWrapEl.classList.remove("round-steal")
	roundScoreEl.textContent = String(points)

	teams.forEach((team, i) => {
		uiTeamUpdate(i, team)
	})

	reactiveEvents()
})

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

	/** @param {BC_TEAM_ACTIVE['detail']} detail  */
	function onActiveTeamSwitch(detail) {
		const { nextTeamIndex, prevTeamIndex } = detail
		teamsWrapEl.dataset.activeTeamIndex = String(nextTeamIndex)
	}

	/** @param {BC_SET_STRIKES['detail']} detail  */
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

	const onGameWinner = /** @type {EventListener} */ (
		/** @param {CustomEvent<GameWinnerDetail>} e */
		(e) => {
			const { state, highestScoringTeam } = e.detail
			document.body.dataset.roundPhase = state.roundPhase
			document.body.dataset.roundType = state.roundType
			gameWinnerNameEl.textContent = highestScoringTeam.name
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

	const onRoundEnd = /** @type {EventListener} */ (
		/** @param {CustomEvent<RoundEndedDetail>} e */
		(e) => {
			// TODO do i really need to send whole state in this event?
			const { state } = e.detail

			uiUpdateScores(state)
			console.log("disabled strikes, round steal. turn on winner badge")
			const { activeTeamIndex, roundSteal, teams } = state
			if (activeTeamIndex === undefined)
				throw new Error("activeTeamIndex is undefined")

			const teamStealIndex = (activeTeamIndex + 1) % teams.length
			const winningTeamIndex = roundSteal ? teamStealIndex : activeTeamIndex

			teamsWrapEl.dataset.winningTeamIndex = String(winningTeamIndex)

			document.body.dataset.roundType = state.roundType
			document.body.dataset.roundPhase = state.roundPhase
			if (state.roundType === "conclusion") {
				console.log("SHOW GAME OVER AND WINNER NAME")
			}
		}
	)

	/** @param {BC_UPDATE_POINTS['detail']} detail  */
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

	gameChannel.addEventListener("message", (event) => {
		// const message = /** @type {MessageEvent<BC_UPDATE_POINTS>} */ (event)
		/** @type {BC_TYPE} */
		const type = event.data.type
		const detail = event.data.detail

		switch (type) {
			case CHANNEL_TYPES.UPDATE_POINTS:
				onIsGuessed(detail)
				break
			case CHANNEL_TYPES.TEAM_UPDATE:
				/** @type {BC_TEAM_UPDATE['detail']} */
				const { index, teamUpdate } = detail
				uiTeamUpdate(index, teamUpdate)
				break
			case CHANNEL_TYPES.SET_STRIKES:
				onSetStrikes(detail)
				break
			case CHANNEL_TYPES.TEAM_ACTIVE:
				onActiveTeamSwitch(detail)
				break

			default:
				break
		}
	})

	// events.addEventListener(TEAM_RENAME, onTeamRename)
	// events.addEventListener(TEAM_ACTIVE, onActiveTeamSwitch)
	// events.addEventListener(EVENT_TYPES.UPDATE_POINTS, onIsGuessed)
	// events.addEventListener(CHANNEL_TYPES.UPDATE_POINTS, onIsGuessed)
	// events.addEventListener(EVENT_TYPES.SET_STRIKES, onStrikeSet)
	// events.addEventListener(EVENT_TYPES.NEXT_ROUND, onRoundNext)
	events.addEventListener(EVENT_TYPES.END_ROUND, onRoundEnd)
	events.addEventListener(EVENT_TYPES.SET_ROUNDPHASE, onRoundPhase)
	events.addEventListener(EVENT_TYPES.GAME_WINNER, onGameWinner)
}

// TODO move this to /ui.js
/** @param {GameState} state  */
function uiUpdateScores(state) {
	const { teams } = state
	teams.forEach((team, i) => {
		const scoreEl = getElementById(`team-${i}`, HTMLSpanElement)

		scoreEl.textContent = String(team.score)
	})
}
