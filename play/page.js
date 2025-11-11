/**
 * @typedef {import('types/Question').Question} Question
 * @typedef {import("types/Answer.js").Answer} Answer
 */

import { events } from "../events.js"
import { EVENT_TYPES } from "../utils/events.js"
import {
	dbFindAnswersByQuestionId,
	dbGetQuestion,
	getAllQuestionDocs,
} from "../db.js"
import { elGameAnswer, getElementById } from "../ui.js"
import {
	convertAnswersToGame,
	filterAndSortVotes,
} from "../utils/filterVotes.js"
import { gameStateManager } from "../utils/gameState.js"

//? may remove this wrap cuz i prob don't need it.
document.addEventListener("DOMContentLoaded", function () {
	// const answersList = getElementById("answers", HTMLDListElement)
	// const questionEl = getElementById("question", HTMLParagraphElement)
	const nextRoundQuestionsEl = getElementById(
		"next-round-questions",
		HTMLUListElement
	)

	getOtherQuestions()
	getQuestionAndAnswers()

	async function getQuestionAndAnswers() {
		const params = new URLSearchParams(window.location.search)
		const id = params.get("id")
		if (id) {
			const question = await dbGetQuestion(id)

			// TODO move any el text setting to ui.js
			// questionEl.innerText = question.text

			const answerDocsRes = await dbFindAnswersByQuestionId(id)
			if (!answerDocsRes.docs) throw new Error("no answerDocsRes.docs")

			const gameAnswers = convertAnswersToGame(answerDocsRes.docs)
			const gameAnswersFilteredSorted = filterAndSortVotes(gameAnswers).slice(
				0,
				8
			)
			// const answerEls = gameAnswersFilteredSorted.map((a) =>
			// 	elGameAnswer(a, true)
			// )

			// // answersList.replaceChildren(...answerEls)
			// gameStateManager.set({ answers: gameAnswersFilteredSorted })
			gameStateManager.load(question, gameAnswersFilteredSorted)
		} else {
			//? look for session storage
			gameStateManager.load()
		}
	}

	async function getOtherQuestions() {
		const allQuestions = await getAllQuestionDocs()

		if (!allQuestions) throw new Error("no questions found")

		const links = allQuestions.map((q) => {
			const li = Object.assign(document.createElement("li"), {})
			const link = Object.assign(document.createElement("a"), {
				className: "question",
				textContent: q.text,
				href: `/play/index.html?id=${q._id}`,
			})
			li.append(link)
			return li
		})

		nextRoundQuestionsEl.replaceChildren(...links)
	}
})