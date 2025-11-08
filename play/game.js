/**
 * @typedef {import('types/Question').Question} Question
 * @typedef {import("types/Answer.js").Answer} Answer
 */

import { events } from "../events.js"
import { EVENT_TYPES } from "../utils/events.js"
import { dbFindAnswersByQuestionId, dbGetQuestion } from "../db.js"
import { elGameAnswer, getElementById } from "../ui.js"
import { convertAnswersToGame, filterAndSortVotes } from "../utils/filterVotes.js"
import { gameStateManager } from "../utils/gameState.js"

//? may remove this wrap cuz i prob don't need it.
document.addEventListener("DOMContentLoaded", function () {
	const answersList = getElementById("answers", HTMLDListElement)
	const nextRoundBtn = getElementById("next-round", HTMLButtonElement)
	const updateBtn = getElementById("updateText", HTMLButtonElement)

  // TODO move to gameState
	/** @type {Question|null} */
	let theQuestion = null

	setupControls()

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
		if(!answerDocsRes.docs) throw new Error("no answerDocsRes.docs");

    const gameAnswers = convertAnswersToGame(answerDocsRes.docs)
		const gameAnswersFilteredSorted = filterAndSortVotes(gameAnswers).slice(0, 8)
		const answerEls = gameAnswersFilteredSorted.map((a) => elGameAnswer(a, true))

		answersList.replaceChildren(...answerEls)
		gameStateManager.set({ answers: gameAnswersFilteredSorted })
	}
	getQuestionAndAnswers()

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
			gameStateManager.set({ round: Number(e.target.value) })
		})

		// const checkboxes = document.querySelectorAll(".strike-checkbox")

		// checkboxes.forEach((checkbox) => {
		// 	checkbox.addEventListener("change", handleStrikeChange)
		// })

		// // Listen for state changes to sync checkboxes
		// events.addEventListener(EVENT_TYPES.STATE_CHANGED, syncStrikesWithState)
	}
})
