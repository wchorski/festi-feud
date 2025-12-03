/**
 * @typedef {import("types/EventDetails.js").BuzzerDetail} BuzzerDetail
 * @typedef {import("types/GameState.js").GameState} GameState
 */
import { getElementById, querySelector } from "../components.js"
import { buzzerChannel } from "./events.js"
// import { EVENT_TYPES, events } from "../utils/events.js"
const buzzerBtn = getElementById("buzzer", HTMLButtonElement)

document.addEventListener("DOMContentLoaded", function () {
	// const onBuzzerRX = /** @type {EventListener} */ (
	// 	/** @param {CustomEvent<BuzzerDetail>} e */
	// 	(e) => {
	// 		const { disabled, activeTeamIndex } = e.detail
	// 		document.body.dataset.activeTeamIndex = String(activeTeamIndex)
	// 		console.log("buzzer B pressed")
	// 	}
	// )
	// events.addEventListener(EVENT_TYPES.BUZZER_B_PRESSED, onBuzzerRX)

	// buzzerBtn.addEventListener("pointerdown", () => {
	// 	console.log("page A: buzzer A pressed")
	// 	events.dispatchEvent(
	// 		new CustomEvent(EVENT_TYPES.BUZZER_A_PRESSED, {
	// 			detail: {
	// 				disabled: true,
	// 				activeTeamIndes: 0,
	// 			},
	// 		})
	// 	)
	// })

	const spanEl = getElementById("team-index", HTMLSpanElement)
	const params = new URLSearchParams(window.location.search)
	const teamIndex = params.get("teamIndex")
	if (!teamIndex) throw new Error("no teamIndex")

	if (teamIndex) {
		spanEl.textContent = teamIndex
		buzzerBtn.addEventListener("pointerdown", () => {
			buzzerChannel.postMessage({
				teamIndex: Number(teamIndex),
				timestamp: Date.now(),
			})
		})

		// TODO fetch team
		setTeamName(Number(teamIndex))
	}

	/** @param {number} teamIndex  */
	async function setTeamName(teamIndex) {
		const teams = await getTeams(teamIndex)
		if (teams) {
			const team = teams.find((_team, i) => i === teamIndex)
			if (team) spanEl.textContent = team.name
		}
	}
})

/**
 * @param {number} teamIndex
 * @returns {Promise<GameState['teams']|null>}
 *  */
async function getTeams(teamIndex) {
	try {
    // TODO need to switch to localstorage for this to work
		const gameStateString = sessionStorage.getItem("gameState")
		if (!gameStateString) return null
		const gameState = JSON.parse(gameStateString)
		return gameState.teams
	} catch (error) {
		console.error("Error loading game state:", error)
		return null
	}
}
