/**
 * @typedef {import('types/Question').Question} Question
 * @typedef {import('types/Question').QuestionSet} QuestionSet
 * @typedef {import('types/Question').QuestionCreateTrans} QuestionCreateTrans
 * @typedef {import('types/Question').QuestionCreateRaw} QuestionCreateRaw
 * @typedef {import('types/Question').QuestionDelete} QuestionDelete
 * @typedef {import("types/Answer.js").Answer} Answer
 * @typedef {import("types/Answer.js").AnswerSet} AnswerSet
 * @typedef {import("types/Answer.js").AnswerCreateRaw} AnswerCreateRaw
 * @typedef {import("types/Answer.js").AnswerCreateTrans} AnswerCreateTrans
 * @typedef {import("types/Answer.js").AnswerDelete} AnswerDelete
 */
// TODO remove `getAllAnswers` from this page.js
import { createTextEl, renderAllTextEls } from "../components.js"
import {
	answersMap,
	dbCreateQuestion,
	dbDeleteAllDocs,
	dbDeleteAnswer,
	dbDeleteQuestion,
	dbSeedDatabase,
	getAllAnswerDocs,
	getAllQuestionDocs,
	questionsMap,
} from "../db.js"
import { events } from "../events.js"
import { formHandler } from "../forms.js"
import { getUserUUID } from "../uuid.js"
import { compose, transforms } from "../transforms.js"

const destroyDdBtn = document.getElementById("destroy-db-btn")
const dbMessage = document.getElementById("db-message")
const seedDbBtn = document.getElementById("seed-db-btn")
const questionsWrap = document.getElementById("questions-wrap")
const questionForm = document.forms.namedItem("questionForm")
const answersWrap = document.getElementById("answers-wrap")
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
		"questions:set",
		//@ts-ignore
		handleQuestionSet
	)
	events.addEventListener(
		"questions:delete",
		//@ts-ignore
		handleQuestionDelete
	)

	formHandler(questionForm, {
		onSubmit: dbCreateQuestion,
		onSuccess: "disable",
		/** @param {QuestionCreateTrans} values */
		validate: (values) => {
			//TODO validate min max of text
			if (!values.text) throw new Error("need input text")
		},
		//? able to make transform async when needed
		/** @param {QuestionCreateRaw} raw */
		transform: async (raw) => {
			const uuid = await getUserUUID()
			return compose(
				transforms.trimStrings,
				transforms.addTimestamp,
				transforms.metadata({ authorId: uuid })
			)(raw)
		},
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
})

async function ini() {
	if (!questionsWrap) throw new Error("no wrap")
	await getAllQuestionDocs()
	renderAllTextEls(questionsMap, questionsWrap, dbDeleteQuestion)

	if (!answersWrap) throw new Error("no wrap")
	await getAllAnswerDocs()
	renderAllTextEls(answersMap, answersWrap, dbDeleteAnswer)

	if (!dbMessage) throw new Error("dbMessage not found in dom")
	if (!seedDbBtn) throw new Error("seedDbBtn not found in dom")
	if (!destroyDdBtn) throw new Error("destroyDdBtn not found in dom")

	seedDbBtn.addEventListener("pointerup", async (e) => {
		const res = await dbSeedDatabase()
		const { error, ok, message } = res
		if (error) dbMessage.style.setProperty("--c-status", "red")
		if (ok) dbMessage.style.setProperty("--c-status", "green")
		dbMessage.textContent = message
	})

	destroyDdBtn.addEventListener("pointerup", async (e) => {
		// const res = await dbEmojiDeleteMany([...emojisMap.values()])
		const res = await dbDeleteAllDocs(
			[...questionsMap.values()],
			[...answersMap.values()]
		)
		if (res.error) dbMessage.style.setProperty("--c-status", "red")
		if (res.ok) dbMessage.style.setProperty("--c-status", "green")
		dbMessage.textContent = res.message
	})
}

document.addEventListener("DOMContentLoaded", function () {
	ini()
})