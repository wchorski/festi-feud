/**
 * @typedef {import('./types/Question').Question} Question
 * @typedef {import('./types/Question').QuestionSet} QuestionSet
 * @typedef {import('./types/Question').QuestionCreate} QuestionCreate
 * @typedef {import('./types/Question').QuestionDelete} QuestionDelete
 * @typedef {import("types/Answer.js").Answer} Answer
 * @typedef {import("types/Answer.js").AnswerSet} AnswerSet
 * @typedef {import("types/Answer.js").AnswerCreate} AnswerCreate
 * @typedef {import("types/Answer.js").AnswerDelete} AnswerDelete
 */

import {
	answersMap,
	createAnswer,
	createQuestion,
	getAllAnswerDocs,
	getAllQuestionDocs,
	questionsMap,
} from "./db.js"
import { events } from "./events.js"

const questionsWrap = document.getElementById("questions-wrap")
const questionForm = document.forms.namedItem("questionForm")
const answersWrap = document.getElementById("answers-wrap")
const answerForm = document.forms.namedItem("answerForm")
if (!questionForm || !answerForm) throw new Error("form(s) not found")

/** @param {QuestionSet} e */
function handleQuestionSet(e) {
  if(!questionsWrap) throw new Error('wrap not found')
	insertTextEl(e.detail, questionsWrap)
}
/** @param {QuestionDelete} e */
function handleQuestionDelete(e) {
	const id = e.detail
	const el = questionsWrap?.querySelector(`[data-id="${id}"]`)
	if (el) el.remove()
}

/** @param {AnswerSet} e */
function handleAnswerSet(e) {
	if(!answersWrap) throw new Error('wrap not found')
	insertTextEl(e.detail, answersWrap)
}
/** @param {AnswerDelete} e */
function handleAnswerDelete(e) {
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

			const res = await createQuestion(point)
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

	events.addEventListener(
		"answers:set",
		//@ts-ignore
		handleAnswerSet
	)
	events.addEventListener(
		"answers:delete",
		//@ts-ignore
		handleAnswerDelete
	)

	answerForm?.addEventListener("submit", async (e) => {
		e.preventDefault()

		const resMsgEl = answerForm.querySelector(".response-message")
		if (!resMsgEl) throw new Error("no resMsgEl on form")

		const point = /** @type {AnswerCreate} */ (
			//@ts-ignore
			Object.fromEntries(new FormData(e.target))
		)
		const { text } = point

		try {
			if (!text || text === "")
				throw new Error("Field validation. Text is required")

			const res = await createAnswer(point)
			if (!res) throw new Error("no doc returned")

			answerForm.reset()

			answerForm.setAttribute("data-state", "success")
			resMsgEl.textContent = `ok: ${res.ok} | id: ${res.id}`

			setTimeout(() => {
				answerForm.setAttribute("data-state", "idle")
			}, 3000)
		} catch (error) {
			answerForm.setAttribute("data-state", "error")
			console.log("form submit error: ", error)
			resMsgEl.textContent = String(error)
		}
	})
})

async function init() {
	if (!questionsWrap) throw new Error("no wrap")
	await getAllQuestionDocs()
	renderParagraphEls(questionsMap, questionsWrap)

	if (!answersWrap) throw new Error("no wrap")
	await getAllAnswerDocs()
	renderParagraphEls(answersMap, answersWrap)
}

init()

//* UI
/**
 * Add a single new message to the top of the container
 * @param {Question|Answer} doc
 * @param {HTMLElement} wrap
 */
function insertTextEl(doc, wrap) {
	if (!questionsWrap) throw new Error("wrap not found")

	const p = Object.assign(document.createElement("p"), {
		textContent: doc.text,
	})
	p.classList.add("card", "anim-fade-in")
	p.style.animationDelay = `${80}ms`
	wrap.prepend(p)
}

/**
 * @param {Map<string, Question|Answer>} map
 * @param {HTMLElement} wrap
 */
export async function renderParagraphEls(map, wrap) {
	const docs = [...map.values()].toReversed()

	if (!docs.length) {
		wrap.append(
			Object.assign(document.createElement("p"), {
				textContent: "No found, create new one",
			})
		)
		return
	}

	const nodes = docs.map((doc, i) => {
		// const p = document.createElement("p")
		// p.textContent = `${i}: ${doc.message}`
		const p = Object.assign(document.createElement("p"), {
			textContent: doc.text,
		})
		p.classList.add("card", "anim-fade-in")
		p.style.animationDelay = `${i * 80}ms`
		return p
	})

	// Append all at once
	wrap.replaceChildren(...nodes)
}
