/**
 * @typedef {import('types/Question').Question} Question
 * @typedef {import("types/Answer.js").Answer} Answer
 */

import { events } from "../events.js"
import { EVENT_TYPES } from "../utils/events.js"
import { dbFindAnswersByQuestionId, dbGetQuestion } from "../db.js"
import { elGameAnswer, getElementById } from "../ui.js"
import {
	convertAnswersToGame,
	filterAndSortVotes,
} from "../utils/filterVotes.js"
import { gameStateManager } from "../utils/gameState.js"

//? may remove this wrap cuz i prob don't need it.
document.addEventListener("DOMContentLoaded", function () {
	const answersList = getElementById("answers", HTMLDListElement)
	const nextRoundBtn = getElementById("next-round", HTMLButtonElement)
	const updateBtn = getElementById("updateText", HTMLButtonElement)

	// TODO move to gameState
	/** @type {Question|null} */
	let theQuestion = null

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
		if (!answerDocsRes.docs) throw new Error("no answerDocsRes.docs")

		const gameAnswers = convertAnswersToGame(answerDocsRes.docs)
		const gameAnswersFilteredSorted = filterAndSortVotes(gameAnswers).slice(
			0,
			8
		)
		const answerEls = gameAnswersFilteredSorted.map((a) =>
			elGameAnswer(a, true)
		)

		answersList.replaceChildren(...answerEls)
		gameStateManager.set({ answers: gameAnswersFilteredSorted })
	}
	getQuestionAndAnswers()
})
