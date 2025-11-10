/**
 * @typedef {import("../types/EventDetails").TeamRenamedDetail} TeamRenamedDetail
 * @typedef {import("../types/EventDetails").StrikesSetDetail} StrikesSetDetail
 * @typedef {import("../types/EventDetails").ActiveTeamDetail} ActiveTeamDetail
 * @typedef {import("types/EventDetails").SetPointsDetail} SetPointsDetail
 */

import { getElementById, uiActiveTeam } from "../ui.js"
import { EVENT_TYPES, events } from "../utils/events.js"

const { TEAM_ACTIVE, STRIKES_SET, TEAM_RENAME } = EVENT_TYPES

/** @type {Window | null} */
let popupWindow = null

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
			const { nextTeamIndex, prevTeamIndex } = e.detail

			if (!popupWindow || popupWindow.closed) {
				alert("Popup is not open!")
				throw new Error("no popup window")
			}

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

// function isPopupOpen() {
// 	if (!popupWindow || popupWindow.closed) {
// 		alert("Popup is not open!")
// 		return
// 	}
// }
