/**
 * @typedef {import('Question.js').Question} Question
 * @typedef {import('Question').QuestionSet} QuestionSet
 * @typedef {import('Question').QuestionCreateTrans} QuestionCreateTrans
 * @typedef {import('Question').QuestionCreateRaw} QuestionCreateRaw
 * @typedef {import('Question').QuestionDelete} QuestionDelete
 * @typedef {import("Answer").Answer} Answer
 * @typedef {import("Answer").AnswerSet} AnswerSet
 * @typedef {import("Answer").AnswerCreateRaw} AnswerCreateRaw
 * @typedef {import("Answer").AnswerCreateTrans} AnswerCreateTrans
 * @typedef {import("Answer").AnswerDelete} AnswerDelete
 */

import {
	createTextEl,
	getElementById,
	renderAllTextEls,
} from "../components.js"
import { answersMap, dbDeleteAnswer, getAllAnswerDocs } from "../db.js"
import { events } from "../utils/events.js"
import { formHandler } from "../forms.js"
import { getUserUUID } from "../uuid.js"
import { compose, transforms } from "../transforms.js"

const destroyDdBtn = document.getElementById("destroy-db-btn")
const dbMessage = document.getElementById("db-message")
const answersWrap = getElementById("answers-wrap", HTMLElement)

// import { getAllQuestionDocs, getAllQuestionIds } from "../db"

// async function init() {
//   const ids = await getAllQuestionDocs()
//   console.log(ids)
// }

/** @param {AnswerSet} e */
function handleAnswerSet(e) {
	if (!answersWrap) throw new Error("wrap not found")
	const p = createTextEl(e.detail, dbDeleteAnswer)
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
		"answers:set",
		//@ts-ignore
		handleAnswerSet
	)
	events.addEventListener(
		"answers:delete",
		//@ts-ignore
		handleAnswerDelete
	)
})

async function ini() {
	if (!answersWrap) throw new Error("no wrap")
	await getAllAnswerDocs()
	renderAllTextEls(answersMap, answersWrap, dbDeleteAnswer)

	if (!dbMessage) throw new Error("dbMessage not found in dom")
}

document.addEventListener("DOMContentLoaded", function () {
	ini()
})
