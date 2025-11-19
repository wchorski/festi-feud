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
import { uiInit } from "./ui.js"
const channel = new BroadcastChannel("game-show-buzzer")

//? may remove this wrap cuz i prob don't need it.
document.addEventListener("DOMContentLoaded", function () {
	// const answersList = getElementById("answers", HTMLDListElement)
	// const questionEl = getElementById("question", HTMLParagraphElement)
	const nextRoundQuestionsEl = getElementById(
		"next-round-questions",
		HTMLUListElement
	)

	channel.onmessage = (event) => {
		const { teamIndex, timestamp } = event.data
		console.log(`Team ${teamIndex} buzzed at ${timestamp}`)
		// Handle the buzzer press (show which team buzzed first, etc.)
		// handleBuzzer(team, timestamp)
	}

	getOtherQuestions()
	getQuestionAndAnswers()

	async function getQuestionAndAnswers() {
		const params = new URLSearchParams(window.location.search)
		const id = params.get("id")
		if (id) {
			const question = await dbGetQuestion(id)

			const answerDocsRes = await dbFindAnswersByQuestionId(id)
			if (!answerDocsRes.docs) throw new Error("no answerDocsRes.docs")

			const gameAnswers = convertAnswersToGame(answerDocsRes.docs)
			const gameAnswersFilteredSorted = filterAndSortVotes(gameAnswers).slice(
				0,
				8
			)
			gameStateManager.load(question, gameAnswersFilteredSorted)
		} else {
			//? look for session storage
			console.log("do i gotta do anything if id is missing?")
			// gameStateManager.load()
		}

		document.body.dataset.roundType = gameStateManager.get().roundType

		// TODO could trigger this with event.dispatch from gameStateManager.load()
		uiInit()
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
			link.addEventListener("click", (e) => {
				e.preventDefault()
				// gameStateManager.set({ round: (gameStateManager.get().round += 1) })

				gameStateManager.setNextRound()
				// Navigate to next page after gameState up
				window.location.href = link.href
			})
			li.append(link)
			return li
		})

		nextRoundQuestionsEl.replaceChildren(...links)
	}
})
