/**
 * @typedef {import('types/Question').Question} Question
 * @typedef {import("types/Answer.js").Answer} Answer
 */
// IIFE to avoid global scope pollution and prevent "Cannot redeclare" errors
import { dbFindAnswersByQuestionId, dbGetQuestion } from "../db.js"
import { events } from "../events.js"
import { elGameAnswer, getElementById } from "../ui.js"
import { EVENT_TYPES } from "../utils/events.js"
import { filterAndSortVotes } from "../utils/filterVotes.js"
import { gameStateManager } from "../utils/gameState.js"

//? may remove this wrap cuz i prob don't need it.
document.addEventListener("DOMContentLoaded", function () {
	// const openBtn = getElementById("btn_open_win", HTMLButtonElement)
	// const closeBtn = getElementById("btn_close_win", HTMLButtonElement)
	const answersList = getElementById("answers", HTMLDListElement)
	const nextRoundBtn = getElementById("next-round", HTMLButtonElement)
	// const textInput = getElementById("textInput", HTMLInputElement)
	const updateBtn = getElementById("updateText", HTMLButtonElement)
	// const colorBtn = getElementById("changeColor", HTMLButtonElement)
	// const addBtn = getElementById("addElement", HTMLButtonElement)

	/** @type {Question|null} */
	let theQuestion = null

	/** @type {Answer[]|null} */
	let theAnswers = null

	// const teamAControls = getElementById("team-a", HTMLDivElement)
	// const teamBControls = getElementById("team-b", HTMLDivElement)
	setupControls()

	// function updatePopupText() {
	// 	if (!popupWindow || popupWindow.closed) {
	// 		alert("Popup is not open!")
	// 		return
	// 	}

	// 	const text = textInput.value
	// 	const contentDiv = popupWindow.document.getElementById("content")

	// 	if (!contentDiv) {
	// 		throw new Error('Element with id "content" not found in popup window')
	// 	}

	// 	contentDiv.textContent = text || "No text entered"
	// }

	// function changePopupColor() {
	// 	if (!popupWindow || popupWindow.closed) {
	// 		alert("Popup is not open!")
	// 		return
	// 	}

	// 	const colors = ["#ffcccc", "#ccffcc", "#ccccff", "#ffffcc", "#ffccff"]
	// 	const randomColor = colors[Math.floor(Math.random() * colors.length)]
	// 	popupWindow.document.body.style.backgroundColor = randomColor
	// }

	// function addElementToPopup() {
	// 	if (!popupWindow || popupWindow.closed) {
	// 		alert("Popup is not open!")
	// 		return
	// 	}

	// 	const container = popupWindow.document.getElementById("dynamicContainer")

	// 	if (!container) {
	// 		throw new Error(
	// 			'Element with id "dynamicContainer" not found in popup window'
	// 		)
	// 	}

	// 	const newElement = popupWindow.document.createElement("p")
	// 	newElement.textContent = `Element added at ${new Date().toLocaleTimeString()}`
	// 	container.appendChild(newElement)
	// }

	async function getQuestionAndAnswers() {
		const params = new URLSearchParams(window.location.search)
		const id = params.get("id")
		if (!id) throw new Error("no question id param")
		const question = await dbGetQuestion(id)
		const questionEl = document.getElementById("question")
		// const popupQuestionEl = popupWindow?.document.getElementById("question")
		if (!questionEl) throw new Error("no questionEl or popupQuestionEl")
		theQuestion = question
		questionEl.innerText = question.text

		const answerDocsRes = await dbFindAnswersByQuestionId(id)
		theAnswers = answerDocsRes.docs

		const theAnswersFilteredSorted = filterAndSortVotes(theAnswers).slice(0, 8)
		const answerEls = theAnswersFilteredSorted.map((a) =>
			elGameAnswer(a, false)
		)
		theAnswers = theAnswersFilteredSorted

		answersList.replaceChildren(...answerEls)
	}
	getQuestionAndAnswers()

	// function setNextRound() {
	// 	if (!theQuestion) throw new Error("no theQuestion")

	// 	const popupQuestionEl = popupWindow?.document.getElementById("question")
	// 	if (!popupQuestionEl) throw new Error("no popupQuestionEl")
	// 	popupQuestionEl.innerText = theQuestion.text

	// 	const popupAnswerEl = popupWindow?.document.getElementById("answers")
	// 	if (!popupAnswerEl) throw new Error("no popupAnswerEl")
	// 	if (!theAnswers) throw new Error("no theAnswers")
	// 	const answerEls = theAnswers.map((a) => elGameAnswer(a))
	// 	popupAnswerEl.replaceChildren(...answerEls)
	// }

	// Event listeners
	// openBtn.addEventListener("pointerup", openPopup)
	// closeBtn.addEventListener("pointerup", closePopup)
	// nextRoundBtn.addEventListener("pointerup", setNextRound)
	// updateBtn.addEventListener("pointerup", updatePopupText)
	// colorBtn.addEventListener("pointerup", changePopupColor)
	// addBtn.addEventListener("pointerup", addElementToPopup)

	function setupControls() {
		/** @type {HTMLInputElement|null} */
		const teamANameInput = document.querySelector('input[name="team-0-name"]')
		/** @type {HTMLInputElement|null} */
		const teamBNameInput = document.querySelector('input[name="team-1-name"]')
		if (!teamANameInput || !teamBNameInput)
			throw new Error("no teamBNameInput or teamBNameInput")

		teamANameInput.oninput = (e) => {
			if (!(e.target instanceof HTMLInputElement))
				throw new Error("not an input el")
			gameStateManager.setTeamName(0, e.target.value)
		}

		teamBNameInput.oninput = (e) => {
			if (!(e.target instanceof HTMLInputElement))
				throw new Error("not an input el")
			gameStateManager.setTeamName(1, e.target.value)
		}

		const strikesContainer = document.querySelector(".strikes")
		if (!strikesContainer) throw new Error("no strikesContainer")

		strikesContainer.addEventListener("change", () => {
			// Count checked checkboxes
			/** @type {NodeListOf<HTMLInputElement>} */
			const checkboxes = strikesContainer.querySelectorAll(
				'input[type="checkbox"]'
			)
			const checkedCount = Array.from(checkboxes).filter(
				(cb) => cb.checked
			).length

			gameStateManager.setStrikes(checkedCount)

			// TODO could change this over to dispatch listener for ui only script
			if (checkedCount === 3) {
				checkboxes.forEach((box) => {
					box.disabled = true
				})
				setTimeout(() => {
					checkboxes.forEach((box) => {
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
			gameStateManager.set({ round: Number(e.target.value )})
		})

		// const checkboxes = document.querySelectorAll(".strike-checkbox")

		// checkboxes.forEach((checkbox) => {
		// 	checkbox.addEventListener("change", handleStrikeChange)
		// })

		// // Listen for state changes to sync checkboxes
		// events.addEventListener(EVENT_TYPES.STATE_CHANGED, syncStrikesWithState)
	}
})
