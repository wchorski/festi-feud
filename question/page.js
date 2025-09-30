import { createTextEl, renderAllTextEls } from "../ui.js"
import { dbFindAnswersByQuestionId, dbGetQuestion } from "../db.js"

const h1 = document.querySelector("h1")
const questionEl = document.getElementById("question")
const answersWrap = document.getElementById("answers-wrap")

async function ini() {
	const params = new URLSearchParams(window.location.search)
	const id = params.get("id")
	if (id) {
		if (!h1) throw new Error("no h1")
		h1.innerText = `Question: ${id}`

		const doc = await dbGetQuestion(id)
		if (!questionEl) throw new Error("no questionEl")
      questionEl.innerText = doc.text
    
    if (!answersWrap) throw new Error("no answersWrap")
		const answerDocsRes = await dbFindAnswersByQuestionId(id)
		// console.log(answerDocsRes)
    renderAllTextEls(answerDocsRes.docs, answersWrap)
	}
}

ini()
