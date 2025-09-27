/**
 * @typedef {import('./types/Question').Question} Question
 * @typedef {import('./types/Question').QuestionSet} QuestionSet
 * @typedef {import('./types/Question').QuestionCreate} QuestionCreate
 * @typedef {import('./types/Question').QuestionDelete} QuestionDelete
 */

import { createQuestion, getAllQuestionDocs, questionsMap } from "./db.js"
import { events } from "./events.js"

const questionsWrap = document.getElementById("questions-wrap")
const questionForm = document.forms.namedItem("questionForm")

/** @param {QuestionSet} e */
function handleMessageSet(e) {
	insertMessage(e.detail)
}
/** @param {QuestionDelete} e */
function handleMessageDelete(e) {
	const id = e.detail
	const el = questionsWrap?.querySelector(`[data-id="${id}"]`)
	if (el) el.remove()
}

document.addEventListener("DOMContentLoaded", function () {
	events.addEventListener(
		"questions:set",
		//@ts-ignore
		handleMessageSet
	)
	events.addEventListener(
		"questions:delete",
		//@ts-ignore
		handleMessageDelete
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
			if (!res) throw new Error("no message doc returned")

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
	await getAllQuestionDocs()
	renderQuestionEls(questionsMap, questionsWrap)
}

init()

//* UI
/**
 * Add a single new message to the top of the container
 * @param {Question} doc
 */
function insertMessage(doc) {
	if (!questionsWrap) throw new Error("wrap not found")

	const p = Object.assign(document.createElement("p"), {
		textContent: doc.text,
	})
	p.classList.add("card", "anim-fade-in")
	p.style.animationDelay = `${80}ms`
	questionsWrap.prepend(p)
}

/**
 * @param {Map<string, Question>} map
 * @param {HTMLElement} wrap
 */
export async function renderQuestionEls(map, wrap) {
	const docs = [...map.values()].toReversed()

	if (!docs.length) {
		wrap.append(
			Object.assign(document.createElement("p"), {
				textContent: "No messages found, create new one",
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
