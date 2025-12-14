/**
 * @typedef {import('Question').Question} Question
 * @typedef {import("Answer").Answer} Answer
 */

import { buzzerChannel } from "../utils/events.js"
import {
	dbFindAnswersByQuestionId,
	dbFindBallotsByQuestionId,
	dbGetQuestion,
	getAllQuestionDocs,
} from "../db.js"
import { getElementById } from "../components.js"
import { gameAnswersTop8 } from "../utils/filterVotes.js"
import { gameStateManager } from "../utils/gameState.js"
import { uiInit } from "./ui.js"

//? may remove this wrap cuz i prob don't need it.
document.addEventListener("DOMContentLoaded", function () {
	// const answersList = getElementById("answers", HTMLDListElement)
	// const questionEl = getElementById("question", HTMLParagraphElement)
	const nextRoundQuestionsEl = getElementById(
		"next-round-questions",
		HTMLUListElement
	)

	// react to inputs from the /buzzer/index.html page
	buzzerChannel.onmessage = (event) => {
		const { teamIndex, timestamp } = event.data
		// console.log(`Team ${teamIndex} buzzed at ${timestamp}`)
		gameStateManager.buzzIn(Number(teamIndex))
		// Handle the buzzer press (show which team buzzed first, etc.)
		// handleBuzzer(team, timestamp)
	}

	// react to same page keyboard presses
	document.addEventListener("keydown", (event) => {
		const { key, code } = event
		// console.log({ key })
		if (["0", "1"].includes(key)) {
			gameStateManager.buzzIn(Number(key))
		}
	})

	getOtherQuestions()
	getQuestionAndAnswers()

	async function getQuestionAndAnswers() {
		const params = new URLSearchParams(window.location.search)
		const id = params.get("id")
		if (id) {
			const question = await dbGetQuestion(id)

			const answerRes = await dbFindAnswersByQuestionId(id)
			if (!answerRes.docs) throw new Error("no answerDocsRes.docs")
			// TODO get ballots and figure out score w new system
			const ballotRes = await dbFindBallotsByQuestionId(id)
			if (!ballotRes.docs) throw new Error("no ballotRes.docs")

			const gameAnswers = gameAnswersTop8(id, ballotRes.docs, answerRes.docs)
			// TODO just a debug check
			console.log(
				"total round points: " +
					gameAnswers.reduce((count, obj) => count + obj.points, 0)
			)

			gameStateManager.load(question, gameAnswers)
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
