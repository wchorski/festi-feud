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
	dbCreateAnswer,
	dbCreateQuestion,
	dbDeleteAnswer,
	dbDeleteQuestion,
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
	if (!questionsWrap) throw new Error("wrap not found")
	const p = createTextEl(e.detail)
	questionsWrap.prepend(p)
}
/** @param {QuestionDelete} e */
function handleQuestionDelete(e) {
	const id = e.detail
	const el = questionsWrap?.querySelector(`[data-id="${id}"]`)
	if (el) el.remove()
}

/** @param {AnswerSet} e */
function handleAnswerSet(e) {
	if (!answersWrap) throw new Error("wrap not found")
	createTextEl(e.detail)
	const p = createTextEl(e.detail)
	answersWrap.prepend(p)
}
/** @param {AnswerDelete} e */
function handleAnswerDelete(e) {
	const id = e.detail
	const el = answersWrap?.querySelector(`[data-id="${id}"]`)
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

			const res = await dbCreateAnswer(point)
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
	renderAllTextEls(questionsMap, questionsWrap)

	if (!answersWrap) throw new Error("no wrap")
	await getAllAnswerDocs()
	renderAllTextEls(answersMap, answersWrap)
}

init()

//* UI
/**
 * Add a single new message to the top of the container
 * @param {Question|Answer} doc
 * @param {number} delay - animation start in ms
 */
function createTextEl(doc, delay = 80) {
	const p = Object.assign(document.createElement("p"), {
		textContent: doc.text,
		//? only getter, not setter
		// dataset: { id: doc._id }
		className: ["card", "anim-fade-in"].join(" "),
	})
	p.dataset.id = doc._id
	p.style.animationDelay = `${delay}ms`

	const deleteBtn = Object.assign(document.createElement("button"), {
		className: "delete",
		ariaLabel: `delete ${doc.typeof} item`,
		title: `delete ${doc.typeof} item`,
		textContent: "x",
		onpointerup:
			doc.typeof === "Question"
				? () => dbDeleteQuestion(doc)
				: doc.typeof === "Answer"
				? () => dbDeleteAnswer(doc)
				: console.error("typeof != Question || Answer"),

		// TODO fix model and switch to error
	})

	p.append(deleteBtn)

	return p
}

/**
 * @param {Map<string, Question|Answer>} map
 * @param {HTMLElement} wrap
 */
export async function renderAllTextEls(map, wrap) {
	const docs = [...map.values()].toReversed()

	if (!docs.length) {
		wrap.append(
			Object.assign(document.createElement("p"), {
				textContent: "No found, create new one",
			})
		)
		return
	}

	const nodes = docs.map((doc, i) => createTextEl(doc, i * 80))

	// Append all at once
	wrap.replaceChildren(...nodes)
}
