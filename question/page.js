/**
 * @typedef {import('types/Question').Question} Question
 * @typedef {import('types/Question').QuestionSet} QuestionSet
 * @typedef {import('types/Question').QuestionCreate} QuestionCreate
 * @typedef {import('types/Question').QuestionDelete} QuestionDelete
 * @typedef {import("types/Answer.js").Answer} Answer
 * @typedef {import("types/Answer.js").AnswerSet} AnswerSet
 * @typedef {import("types/Answer.js").AnswerCreate} AnswerCreate
 * @typedef {import("types/Answer.js").AnswerDelete} AnswerDelete
 */
import {
	createTextEl,
	elAnswerVote,
	renderAllTextEls,
	voteButtons,
} from "../ui.js"
import {
	dbCreateAnswer,
	dbDeleteAnswer,
	dbFindAnswersByQuestionId,
	dbGetQuestion,
} from "../db.js"
import { events } from "../events.js"
import { formHandler } from "../forms.js"

const h1 = document.querySelector("h1")
const questionEl = document.getElementById("question")
const answersWrap = document.getElementById("answers-wrap")
const answerForm = document.forms.namedItem("answerForm")
let questionId = ""
if (!answerForm) throw new Error("form(s) not found")

/** @param {AnswerSet} e */
function handleAnswerSet(e) {
	if (!answersWrap) throw new Error("wrap not found")
	if (e.detail.questionId === questionId) {
		const p = createTextEl(e.detail, dbDeleteAnswer)
		answersWrap.prepend(p)
	}
}
/** @param {AnswerDelete} e */
function handleAnswerDelete(e) {
	const id = e.detail
	const el = answersWrap?.querySelector(`[data-id="${id}"]`)
	if (el) el.remove()
}

document.addEventListener("DOMContentLoaded", function () {
	// TODO maybe i shouldn't listen to events because it will react to ANY changes to answersDB
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

	formHandler(answerForm, {
		onSubmit: dbCreateAnswer,
		/** @param {AnswerCreate} values */
		validate: (values) => {
			if (!values.text) throw new Error("need input text")
			//TODO validate min max of text
		},
	})
})

async function ini() {
	const params = new URLSearchParams(window.location.search)
	const id = params.get("id")
	if (id) {
		questionId = id
		if (!h1) throw new Error("no h1")
		h1.innerText = `Question: ${id}`

		const doc = await dbGetQuestion(id)
		if (!questionEl) throw new Error("no questionEl")
		questionEl.innerText = doc.text

		if (!answersWrap) throw new Error("no answersWrap")
		const answerDocsRes = await dbFindAnswersByQuestionId(id)
		// console.log(answerDocsRes)
		// renderAllTextEls(answerDocsRes.docs, answersWrap)
		const answerEls = answerDocsRes.docs.map((doc) => elAnswerVote(doc))
		answersWrap.replaceChildren(...answerEls)

		// const voteBtns = voteButtons("vote 4 me")
		// answersWrap.append(voteBtns)

		if (!answerForm) throw new Error("form(s) not found")
		// const questionIdField = document.querySelector('[name="questionId"]')

		const questionIdField = /** @type {HTMLInputElement}*/ (
			answerForm.elements.namedItem("questionId")
		)
		questionIdField.value = id
	}
}

ini()
