/**
 * @typedef {import('types/Question').Question} Question
 * @typedef {import('types/Question').QuestionSet} QuestionSet
 * @typedef {import('types/Question').QuestionCreateTrans} QuestionCreateTrans
 * @typedef {import('types/Question').QuestionDelete} QuestionDelete
 * @typedef {import("types/Answer.js").Answer} Answer
 * @typedef {import("types/Answer.js").AnswerSet} AnswerSet
 * @typedef {import("types/Answer.js").AnswerCreateRaw} AnswerCreateRaw
 * @typedef {import("types/Answer.js").AnswerCreateTrans} AnswerCreateTrans
 * @typedef {import("types/Answer.js").AnswerDelete} AnswerDelete
 */
import { elAnswerVoteInput } from "../ui.js"
import {
	dbCreateAnswer,
	dbDeleteAnswer,
	dbFindAnswersByQuestionId,
	dbGetQuestion,
	dbVotePerQuestion,
} from "../db.js"
// import { events } from "../events.js"
import { formHandler, formVoterHandler } from "../forms.js"
import { compose, transforms } from "../transforms.js"
import { getUserUUID } from "../uuid.js"
import { filterAndSortVotes } from "../utils/filterVotes.js"

const h1 = document.querySelector("h1")
const questionEl = document.getElementById("question")
const answersWrap = document.getElementById("answers-wrap")
const answerForm = document.forms.namedItem("answerForm")
const voteForm = document.forms.namedItem("voteForm")
let questionId = ""
if (!answerForm || !voteForm) throw new Error("form(s) not found")

// /** @param {AnswerSet} e */
// function handleAnswerSet(e) {
// 	if (!answersWrap) throw new Error("wrap not found")
// 	if (e.detail.questionId === questionId) {
// 		const p = createTextEl(e.detail, dbDeleteAnswer)
// 		answersWrap.prepend(p)
// 	}
// }
// /** @param {AnswerDelete} e */
// function handleAnswerDelete(e) {
// 	const id = e.detail
// 	const el = answersWrap?.querySelector(`[data-id="${id}"]`)
// 	if (el) el.remove()
// }

// TODO maybe i shouldn't listen to events because it will react to ANY changes to answersDB
// events.addEventListener(
// 	"answers:set",
// 	//@ts-ignore
// 	handleAnswerSet
// )
// events.addEventListener(
// 	"answers:delete",
// 	//@ts-ignore
// 	handleAnswerDelete
// )

// TODO throw a "submission already made" if uuid exists in question.voterIds array
async function ini() {
	const params = new URLSearchParams(window.location.search)
	const id = params.get("id")
	if (id) {
		questionId = id
		if (!h1) throw new Error("no h1")
		h1.innerText = `Question: ${id}`

		const question = await dbGetQuestion(id)
		if (!questionEl) throw new Error("no questionEl")
		questionEl.innerText = question.text

		if (!answersWrap) throw new Error("no answersWrap")
		const answerDocsRes = await dbFindAnswersByQuestionId(id)
		const votes = filterAndSortVotes(answerDocsRes.docs)
		// TODO should i sort by popularity? could cause bias 
    // console.log(votes);
		// console.log(answerDocsRes)
		// renderAllTextEls(answerDocsRes.docs, answersWrap)
		const answerEls = votes.map((doc) => elAnswerVoteInput(doc))
		answersWrap.replaceChildren(...answerEls)

		// const voteBtns = voteButtons("vote 4 me")
		// answersWrap.append(voteBtns)

		if (!answerForm || !voteForm) throw new Error("form(s) not found")
		// const questionIdField = document.querySelector('[name="questionId"]')

		const answerFormQuestionIdField = /** @type {HTMLInputElement}*/ (
			answerForm.elements.namedItem("questionId")
		)
		answerFormQuestionIdField.value = id

		formHandler(answerForm, {
			onSubmit: dbCreateAnswer,
			onSuccess: "disable",
			/** @param {AnswerCreateTrans} values */
			validate: (values) => {
				//TODO validate min max of text
				if (!values.text) throw new Error("need input text")
				if (!values.questionId) throw new Error("need input questionId")
				if (
					values.answers?.flatMap((a) => a.authorId).includes(values.authorId)
				)
					throw new Error("Can only submit one new answer")
				if (!values.downvotes || !values.upvotes)
					throw new Error(
						"must include upvotes and downvotes arrays even if empty"
					)
			},
			//? able to make transform async when needed
			/** @param {AnswerCreateRaw} raw */
			transform: async (raw) => {
				const uuid = await getUserUUID()
				return compose(
					transforms.trimStrings,
					transforms.addTimestamp,
					transforms.metadata({
						answers: answerDocsRes.docs,
						authorId: uuid,
						upvotes: [],
						downvotes: [],
					})
				)(raw)
			},
		})

		formVoterHandler(voteForm, {
			onSubmit: dbVotePerQuestion,
			metadata: {
				question,
				answers: answerDocsRes.docs,
			},
		})
	}
}

document.addEventListener("DOMContentLoaded", function () {
	ini()
})
