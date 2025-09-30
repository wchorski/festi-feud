/**
 * @typedef {import('types/Question').Question} Question
 * @typedef {import('types/Question').QuestionSet} QuestionSet
 * @typedef {import('types/Question').QuestionCreate} QuestionCreate
 * @typedef {import('types/Question').QuestionDelete} QuestionDelete
 * @typedef {import("types/Answer.js").Answer} Answer
 * @typedef {import("types/Answer.js").AnswerSet} AnswerSet
 * @typedef {import("types/Answer.js").AnswerCreate} AnswerCreate
 * @typedef {import("types/Answer.js").AnswerDelete} AnswerDelete
 * @typedef {import("types/RemoveObject").RemoveObject} RemoveObject
 */

import { dbDeleteAnswer, dbDeleteQuestion } from "./db.js"

/**
 * Add a single new message to the top of the container
 * @param {Question|Answer} doc
 * @param {(doc:RemoveObject) => Promise<void>} deleteFunc
 * @param {number} delay - animation start in ms
 */
export function createTextEl(doc, deleteFunc, delay = 80) {
	const p = Object.assign(document.createElement("p"), {
		textContent: doc.text + "  ",
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
			doc.typeof === "Question" || doc.typeof === "Answer"
				? () => deleteFunc(doc)
				: console.error("typeof != Question || Answer"),

		// TODO fix model and switch to error
	})

	const linkEl = Object.assign(document.createElement("a"), {
		// className: "delete",
		// ariaLabel: `delete ${doc.typeof} item`,
		// title: `go to poll`,
		textContent: "-->",
		href: `/${doc.typeof.toLowerCase()}/index.html?id=${doc._id}`,

		// TODO fix model and switch to error
	})

	p.append(linkEl, deleteBtn)

	return p
}

/**
 * @param {Map<string, Question|Answer> | Array<Question|Answer>} mapOrArray
 * @param {HTMLElement} wrap
 */
export async function renderAllTextEls(mapOrArray, wrap) {
	const docs = (mapOrArray instanceof Map 
		? [...mapOrArray.values()] 
		: mapOrArray
	).toReversed()

	if (!docs.length) {
		wrap.append(
			Object.assign(document.createElement("p"), {
				textContent: "No found, create new one",
			})
		)
		return
	}

	function deleteFunc(/** @type {Question|Answer} */ doc) {

		switch (doc.typeof) {
			case "Question":
				return dbDeleteQuestion
			case "Answer":
				return dbDeleteAnswer
			default:
				console.error("typeof != Question || Answer")
				throw new Error(`Invalid doc.typeof`)
		}
	}

	const nodes = docs.map((doc, i) => {
		return createTextEl(doc, deleteFunc(doc), i * 80)
	})

	// Append all at once
	wrap.replaceChildren(...nodes)
}
