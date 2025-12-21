/**
 * @typedef {import('Question').Question} Question
 * @typedef {import('Question').QuestionSet} QuestionSet
 * @typedef {import('Question').QuestionCreateTrans} QuestionCreateTrans
 * @typedef {import('Question').QuestionDelete} QuestionDelete
 * @typedef {import("Answer").Answer} Answer
 * @typedef {import("Answer").AnswerSet} AnswerSet
 * @typedef {import("Answer").AnswerCreateRaw} AnswerCreateRaw
 * @typedef {import("Answer").AnswerCreateTrans} AnswerCreateTrans
 * @typedef {import("Answer").AnswerDelete} AnswerDelete
 */
import { elAnswerVoteInput, getElementById } from "../components.js"
import {
	dbCreateAnswer,
	dbCreateBallot,
	dbDeleteAnswer,
	dbFindAnswersByQuestionId,
	dbFindBallotsByQuestionId,
	dbGetQuestion,
} from "../db.js"
import { formBallotHandler, formHandler, formVoterHandler } from "../forms.js"
import { compose, transforms } from "../transforms.js"
import { getUserUUID } from "../uuid.js"

// const h1 = document.querySelector("h1")
const questionEl = getElementById("question", HTMLSpanElement)
const questionOnFormEl = getElementById("question-on-form", HTMLSpanElement)
const answersWrap = getElementById("answers-wrap", HTMLFieldSetElement)
const answerForm = document.forms.namedItem("answerForm")
const ballotForm = document.forms.namedItem("ballotForm")
const playLinkEl = getElementById("play-link", HTMLAnchorElement)
let questionId = ""
if (!answerForm || !ballotForm) throw new Error("form(s) not found")

// TODO throw a "submission already made" if uuid exists in question.voterIds array
async function ini() {
	const params = new URLSearchParams(window.location.search)
	const id = params.get("id")
	if (id) {
		questionId = id

		const question = await dbGetQuestion(id)
		questionEl.textContent = question.text
		questionOnFormEl.textContent = question.text
		playLinkEl.href = `/play/index.html?id=${id}`

		if (!answersWrap) throw new Error("no answersWrap")
		const answerDocsRes = await dbFindAnswersByQuestionId(id)
		const ballotDocsRes = await dbFindBallotsByQuestionId(id)
		console.log(ballotDocsRes)
		const uuid = localStorage.getItem("user_fingerprint")
		if (uuid) {
			const hasUserVoted = ballotDocsRes.docs
				.flatMap((doc) => doc.voterId)
				.includes(uuid)
			if (hasUserVoted && ballotForm) {
				ballotForm.dataset.state = "error"
				// ballotForm.disabled = true // <-- doesn't work
				answersWrap.disabled = true
				const messageEl = ballotForm.querySelector(".response-message")
				console.log(ballotForm)
				console.log(messageEl)
				if (messageEl) messageEl.textContent = "You have already voted"
			}
		}

		// TODO check `voterId` is included in ballots
		// warn user if they already voted

		// TODO should i sort by popularity? could cause bias
		// console.log(votes);
		// console.log(answerDocsRes)
		// renderAllTextEls(answerDocsRes.docs, answersWrap)
		const answerEls = answerDocsRes.docs.map((doc) =>
			elAnswerVoteInput(doc, ballotDocsRes.docs)
		)
		answersWrap.replaceChildren(...answerEls)

		// const voteBtns = voteButtons("vote 4 me")
		// answersWrap.append(voteBtns)

		if (!answerForm || !ballotForm) throw new Error("form(s) not found")
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
					})
				)(raw)
			},
		})

		// TODO create a Ballot instead
		formBallotHandler(ballotForm, {
			onSubmit: dbCreateBallot,
			metadata: {
				questionId,
			},
		})
	}
}

document.addEventListener("DOMContentLoaded", function () {
	ini()
})
