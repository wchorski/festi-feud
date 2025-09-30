/**
 * @typedef {import('types/Question').QuestionSet} QuestionSet
 * @typedef {import('types/Question').Question} Question
 * @typedef {import('types/Question').QuestionCreate} QuestionCreate
 * @typedef {import('types/Question').QuestionDelete} QuestionDelete
 * @typedef {import("types/Answer.js").Answer} Answer
 * @typedef {import("types/Answer.js").AnswerSet} AnswerSet
 * @typedef {import("types/Answer.js").AnswerCreate} AnswerCreate
 * @typedef {import("types/Answer.js").AnswerDelete} AnswerDelete
 */

import { createTextEl, renderAllTextEls } from "../ui.js"
import {
	dbCreateQuestion,
	dbDeleteQuestion,
	getAllQuestionDocs,
	questionsMap,
} from "../db.js"
import { events } from "../events.js"

const questionsWrap = document.getElementById("questions-wrap")
const questionForm = document.forms.namedItem("questionForm")
if (!questionForm) throw new Error("form(s) not found")

/** @param {QuestionSet} e */
function handleQuestionSet(e) {
	if (!questionsWrap) throw new Error("wrap not found")
	const p = createTextEl(e.detail, dbDeleteQuestion)
	questionsWrap.prepend(p)
}
/** @param {QuestionDelete} e */
function handleQuestionDelete(e) {
	const id = e.detail
	const el = questionsWrap?.querySelector(`[data-id="${id}"]`)
	if (el) el.remove()
}

document.addEventListener("DOMContentLoaded", function () {
	events.addEventListener(
		"questions:set",
		//@ts-ignore
		handleQuestionSet
	)
	events.addEventListener(
		"questions:delete",
		//@ts-ignore
		handleQuestionDelete
	)

	questionForm?.addEventListener("submit", async (e) => {
		e.preventDefault()

		const resMsgEl = questionForm.querySelector(".response-message")
		if (!resMsgEl) throw new Error("no resMsgEl on form")

		const point = /** @type {QuestionCreate} */ (
			//@ts-ignore
			Object.fromEntries(new FormData(e.target))
		)
		const { text } = point

		try {
			if (!text || text === "")
				throw new Error("Field validation. Text is required")

			const res = await dbCreateQuestion(point)
			if (!res) throw new Error("no doc returned")

			questionForm.reset()

			questionForm.setAttribute("data-state", "success")
			resMsgEl.textContent = `ok: ${res.ok} | id: ${res.id}`

			setTimeout(() => {
				questionForm.setAttribute("data-state", "idle")
			}, 3000)
		} catch (error) {
			questionForm.setAttribute("data-state", "error")
			console.log("form submit error: ", error)
			resMsgEl.textContent = String(error)
		}
	})
})

async function init() {
	if (!questionsWrap) throw new Error("no wrap")
	const qs = await getAllQuestionDocs()
	renderAllTextEls(questionsMap, questionsWrap)
}

init()
