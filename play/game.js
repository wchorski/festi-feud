/**
 * @typedef {import('types/Question').Question} Question
 * @typedef {import("types/Answer.js").Answer} Answer
 */
// IIFE to avoid global scope pollution and prevent "Cannot redeclare" errors
import { dbFindAnswersByQuestionId, dbGetQuestion } from "../db.js"
import { elGameAnswer, getElementById } from "../ui.js"
import { filterAndSortVotes } from "../utils/filterVotes.js"

//? may remove this wrap cuz i prob don't need it.
document.addEventListener("DOMContentLoaded", function () {
	const openBtn = getElementById("btn_open_win", HTMLButtonElement)
	const answersList = getElementById("answers", HTMLDListElement)
	const nextRoundBtn = getElementById("next-round", HTMLButtonElement)
	const closeBtn = getElementById("btn_close_win", HTMLButtonElement)
	const textInput = getElementById("textInput", HTMLInputElement)
	const updateBtn = getElementById("updateText", HTMLButtonElement)
	const colorBtn = getElementById("changeColor", HTMLButtonElement)
	const addBtn = getElementById("addElement", HTMLButtonElement)

	/** @type {Question|null} */
	let theQuestion = null

	/** @type {Answer[]|null} */
	let theAnswers = null

	// const teamAControls = getElementById("team-a", HTMLDivElement)
	// const teamBControls = getElementById("team-b", HTMLDivElement)
	setupControls()

	/** @type {Window | null} */
	let popupWindow = null

	/** @returns {void} */
	function openPopup() {
		const features =
			"width=600,height=400,left=100,top=100,menubar=no,toolbar=no,location=no,status=no,scrollbars=yes"

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

	function updatePopupText() {
		if (!popupWindow || popupWindow.closed) {
			alert("Popup is not open!")
			return
		}

		const text = textInput.value
		const contentDiv = popupWindow.document.getElementById("content")

		if (!contentDiv) {
			throw new Error('Element with id "content" not found in popup window')
		}

		contentDiv.textContent = text || "No text entered"
	}

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

		const theAnswersFilteredSorted = filterAndSortVotes(theAnswers, ).slice(0, 8)
		const answerEls = theAnswersFilteredSorted.map((a) => elGameAnswer(a, false))
		theAnswers = theAnswersFilteredSorted

		answersList.replaceChildren(...answerEls)
	}
	getQuestionAndAnswers()

	function setNextRound() {
		if (!theQuestion) throw new Error("no theQuestion")

		const popupQuestionEl = popupWindow?.document.getElementById("question")
		if (!popupQuestionEl) throw new Error("no popupQuestionEl")
		popupQuestionEl.innerText = theQuestion.text

		const popupAnswerEl = popupWindow?.document.getElementById("answers")
		if (!popupAnswerEl) throw new Error("no popupAnswerEl")
		if (!theAnswers) throw new Error("no theAnswers")
		const answerEls = theAnswers.map((a) => elGameAnswer(a))
		popupAnswerEl.replaceChildren(...answerEls)
	}

	// Event listeners
	openBtn.addEventListener("pointerup", openPopup)
	nextRoundBtn.addEventListener("pointerup", setNextRound)
	closeBtn.addEventListener("pointerup", closePopup)
	updateBtn.addEventListener("pointerup", updatePopupText)
	// colorBtn.addEventListener("pointerup", changePopupColor)
	// addBtn.addEventListener("pointerup", addElementToPopup)

	/**
	 * @param {"a"|"b"} team
	 * @param {string} string
	 */
	function setTeamName(team, string) {
		if (!popupWindow || popupWindow.closed) {
			alert("Popup is not open!")
			return
		}

		let h2 = undefined

		switch (team) {
			case "a":
				h2 = popupWindow.document.getElementById("team-a")?.querySelector("h2")
				break
			case "b":
				h2 = popupWindow.document.getElementById("team-b")?.querySelector("h2")
				break
		}
		if (!h2) throw new Error("h2 not found")
		h2.textContent = string || `Team ${team}`
	}

	function setupControls() {
		/** @type {HTMLInputElement|null} */
		const teamANameInput = document.querySelector('input[name="team-a-name"]')
		/** @type {HTMLInputElement|null} */
		const teamBNameInput = document.querySelector('input[name="team-b-name"]')
		if (!teamANameInput || !teamBNameInput)
			throw new Error("no teamBNameInput or teamBNameInput")

		teamANameInput.oninput = (e) => {
			//@ts-ignore
			setTeamName("a", e.target?.value)
		}
		teamBNameInput.oninput = (e) => {
			//@ts-ignore
			setTeamName("b", e.target?.value)
		}
		// teamBNameInput
		// teamANameInput?.addEventListener("change", (e) => console.log(e.))
		// teamBNameInput?.addEventListener("change", (e) => console.log(e.value))
	}
})
