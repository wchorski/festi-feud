import { dbFindAnswersByQuestionId, dbGetQuestion } from "../db.js"

const h1 = document.querySelector("h1")
const questionEl = document.getElementById("question")
const answersWrap = document.getElementById("answers-wrap")
let questionId = ""

async function ini() {
	const params = new URLSearchParams(window.location.search)
	const id = params.get("id")
	if (id) {
		questionId = id
		if (!h1) throw new Error("no h1")
		h1.innerText = `Play | Question: ${id}`

		const question = await dbGetQuestion(id)
		if (!questionEl) throw new Error("no questionEl")
		questionEl.innerText = question.text

		// TODO add answers to hidden object until score reveal
		// const answerDocsRes = await dbFindAnswersByQuestionId(id)

		// if (!answersWrap) throw new Error("no answersWrap")
		// const answerEls = answerDocsRes.docs.map((doc, i) => {
		// 	return Object.assign(document.createElement("li"), {
		// 		textContent: `#${i}) ` + doc.text + "  ",
		// 		//? only getter, not setter
		// 		// dataset: { id: doc._id }
		// 		className: ["card", "anim-fade-in"].join(" "),
		// 	})
		// })

		// answersWrap.replaceChildren(...answerEls)
		// console.log(answerDocsRes)
	}
}

document.addEventListener("DOMContentLoaded", function () {
	ini()
})
