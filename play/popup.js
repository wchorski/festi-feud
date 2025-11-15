//! USING play/ui.js instead
//! USING play/ui.js instead
//! USING play/ui.js instead
//! USING play/ui.js instead
//! USING play/ui.js instead
//! USING play/ui.js instead
//! USING play/ui.js instead
//! USING play/ui.js instead
//! USING play/ui.js instead
//! USING play/ui.js instead
//! USING play/ui.js instead
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

document.addEventListener("DOMContentLoaded", function () {
	// setupControls()

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
			alert("Popup is not open!")
			return
		}

		let h2 = undefined

		h2 = popupWindow.document
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
			console.log("onActiveTeamSwitch")
			const { nextTeamIndex, prevTeamIndex } = e.detail

			if (!popupWindow || popupWindow.closed) {
				alert("Popup is not open!")
				throw new Error("no popup window")
			}

			// nextTeamIndex === undefined
			// 	? uiToggleCheckboxDisables(true)
			// 	: uiToggleCheckboxDisables(false)

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
})

// function setupControls() {
// 	strikesWrap.addEventListener("change", () => {
// 		const activeTeamIndex = gameStateManager.get().activeTeamIndex

// 		strikeCheckboxes = strikesWrap.querySelectorAll('input[type="checkbox"]')
// 		const checkedCount = Array.from(strikeCheckboxes).filter(
// 			(cb) => cb.checked
// 		).length
// 		gameStateManager.setStrikes(checkedCount)

// 		if (activeTeamIndex === undefined) {
// 			strikeCheckboxes.forEach((box) => {
// 				box.disabled
// 			})
// 		}

// 		// TODO could change this over to dispatch listener for ui only script
// 		if (checkedCount === 3) {
// 			strikeCheckboxes.forEach((box) => {
// 				box.disabled = true
// 			})
// 			setTimeout(() => {
// 				strikeCheckboxes?.forEach((box) => {
// 					box.checked = false
// 					box.disabled = false
// 				})
// 			}, 3000)
// 		}
// 	})
// }

// /** @param {boolean} disabled  */
// function uiToggleCheckboxDisables(disabled) {
// 	strikeCheckboxes?.forEach((box) => {
// 		box.disabled = disabled
// 	})
// }