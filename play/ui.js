/**
 * @typedef {import("../types/EventDetails").TeamRenamedDetail} TeamRenamedDetail
 * @typedef {import("../types/EventDetails").StrikesSetDetail} StrikesSetDetail
 * @typedef {import("../types/EventDetails").ActiveTeamDetail} ActiveTeamDetail
 * @typedef {import("types/EventDetails").SetPointsDetail} SetPointsDetail
 */

import { getElementById, uiActiveTeam } from "../ui.js"
import { EVENT_TYPES, events } from "../utils/events.js"
import { gameStateManager } from "../utils/gameState.js"

const { TEAM_ACTIVE, SET_STRIKES: STRIKES_SET, TEAM_RENAME } = EVENT_TYPES

/** @type {Window | null} */
let popupWindow = null
const team0ActiveCheckbox = getElementById("team-0-active", HTMLInputElement)
const team1ActiveCheckbox = getElementById("team-1-active", HTMLInputElement)
const strikesWrap = getElementById("game-strikes", HTMLDivElement)
/** @type {NodeListOf<HTMLInputElement>} */
const strikeCheckboxes = strikesWrap.querySelectorAll('input[type="checkbox"]')
if (!strikeCheckboxes) throw new Error("no strikeCheckboxes")

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
	/**
	 * @param {number} teamIndex
	 * @param {string} newName
	 */
	function uiTeamName(teamIndex, newName) {
		if (!popupWindow || popupWindow.closed) {
			// TODO add back in for moderator
			console.log("Popup is not open!")
			// alert("Popup is not open!")
			// return
		}

		let h2 = undefined

		h2 = popupWindow?.document
			.getElementById(`team-${teamIndex}`)
			?.querySelector("h2")

		if (!h2) throw new Error("h2 not found")
		h2.textContent = newName || `Team ${teamIndex}`
	}

	/** @param {number} points  */
	function uiPointsDisplay(points) {
		// TODO move this definition to top
		const elRoundScore = getElementById("round-score", HTMLElement)
		elRoundScore.textContent = points.toString()
	}

	const onActiveTeamSwitch = /** @type {EventListener} */ (
		/** @param {CustomEvent<ActiveTeamDetail>} e */
		(e) => {
			const { nextTeamIndex, prevTeamIndex } = e.detail

			if (!popupWindow || popupWindow.closed) {
				// TODO add back alert after dev
				console.log("Popup is not open!")
				// alert("Popup is not open!")
				// throw new Error("no popup window")
			}
			uiActiveTeamCheckboxToggles(nextTeamIndex)
			nextTeamIndex === undefined
				? uiToggleCheckboxDisables(true)
				: uiToggleCheckboxDisables(false)

			uiActiveTeam(prevTeamIndex, nextTeamIndex, popupWindow)
			// TODO isn't popup related but... lazy
			uiActiveTeam(prevTeamIndex, nextTeamIndex, window)
		}
	)

	const onTeamRename = /** @type {EventListener} */ (
		/** @param {CustomEvent<TeamRenamedDetail>} e */
		(e) => {
			const { oldName, newName, teamIndex } = e.detail
			uiTeamName(teamIndex, newName)
		}
	)

	const onIsGuessed = /** @type {EventListener} */ (
		/** @param {CustomEvent<SetPointsDetail>} e */
		(e) => {
			const { prevPoints, currentPoints } = e.detail
			uiPointsDisplay(currentPoints)
		}
	)
	events.addEventListener(EVENT_TYPES.UPDATE_POINTS, onIsGuessed)

	// listeners
	openBtn.addEventListener("pointerup", openPopup)
	closeBtn.addEventListener("pointerup", closePopup)
	events.addEventListener(TEAM_RENAME, onTeamRename)
	events.addEventListener(TEAM_ACTIVE, onActiveTeamSwitch)

	setupControls()
})

function setupControls() {
	const teamANameInput = getElementById("team-0-name", HTMLInputElement)
	const team1NameInput = getElementById("team-1-name", HTMLInputElement)

	teamANameInput.oninput = (e) => {
		if (!(e.target instanceof HTMLInputElement))
			throw new Error("not an input el")
		gameStateManager.setTeamName(0, e.target.value)
	}

	team1NameInput.oninput = (e) => {
		if (!(e.target instanceof HTMLInputElement))
			throw new Error("not an input el")
		gameStateManager.setTeamName(1, e.target.value)
	}

	team0ActiveCheckbox.oninput = (e) => {
		if (!(e.target instanceof HTMLInputElement))
			throw new Error("not an input el")

		// e.target.checked
		// 	? (team1ActiveCheckbox.checked = false)
		// 	: (team1ActiveCheckbox.checked = true)

		gameStateManager.setActiveTeam(e.target.checked ? 0 : undefined)
	}

	team1ActiveCheckbox.oninput = (e) => {
		if (!(e.target instanceof HTMLInputElement))
			throw new Error("not an input el")

		// e.target.checked
		// 	? (team0ActiveCheckbox.checked = false)
		// 	: (team0ActiveCheckbox.checked = true)

		gameStateManager.setActiveTeam(e.target.checked ? 1 : undefined)
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

		// TODO could change this over to dispatch listener for ui only script
		if (checkedCount === 3) {
			strikeCheckboxes.forEach((box) => {
				box.disabled = true
			})
			setTimeout(() => {
				strikeCheckboxes?.forEach((box) => {
					box.checked = false
					box.disabled = false
				})
			}, 3000)
		}
	})

	/** @type {HTMLInputElement|null} */
	const gameRoundNumInput = document.querySelector('input[name="round"]')
	if (!gameRoundNumInput) throw new Error("no gameRoundNumInput")

	gameRoundNumInput.addEventListener("change", (e) => {
		if (!(e.target instanceof HTMLInputElement))
			throw new Error("not an input el")
		gameStateManager.set({ round: Number(e.target.value) })
	})
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
}
