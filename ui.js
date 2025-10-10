/**
 * @typedef {Object} ElementProps
 * @typedef {import('types/Question').Question} Question
 * @typedef {import('types/Question').QuestionSet} QuestionSet
 * @typedef {import('types/Question').QuestionCreateTrans} QuestionCreateTrans
 * @typedef {import('types/Question').QuestionDelete} QuestionDelete
 * @typedef {import("types/Answer.js").Answer} Answer
 * @typedef {import("types/Answer.js").AnswerSet} AnswerSet
 * @typedef {import("types/Answer.js").AnswerCreateTrans} AnswerCreateTrans
 * @typedef {import("types/Answer.js").AnswerDelete} AnswerDelete
 * @typedef {import("types/RemoveObject").RemoveObject} RemoveObject
 * @typedef {function(string, Record<string, any>|null, ...(HTMLElement|string)[]): HTMLElement} CreateElement
 */
//! don't import anything relating to db in here
// import { dbDeleteAnswer, dbDeleteQuestion } from "./db.js"

/**
 * @template {HTMLElement} T
 * @param {string} id
 * @param {new () => T} type
 * @returns {T}
 */
export function getElementById(id, type) {
	const el = document.getElementById(id)
	if (!el) throw new Error(`Element with id "${id}" not found`)
	return /** @type {T} */ (el)
}

// TODO look into using template strings. seemed like a lot of type gymnastics tho and should probably stick to js
// //@ts-ignore
// const html = htm.bind((type, props, ...children) => {
// 	const el = document.createElement(type)
// 	if (props) Object.assign(el, props)
// 	children.flat().forEach((child) => {
// 		el.append(typeof child === "string" ? child : child)
// 	})
// 	return el
// })

// /**
//  * Creates vote buttons with + and - controls
//  * @param {string} label - The label text to display
//  * @returns {HTMLDivElement}
//  */
// export const voteButtons = (label) => html`
// 	<div>
// 		<span>${label}</span>
// 		<button type="button">+</button>
// 		<button type="button">-</button>
// 	</div>
// `

/**
 * @param {string} label
 * @returns {HTMLDivElement}
 */
export const voteButtons = (label) => {
	const container = document.createElement("div")

	const span = Object.assign(document.createElement("span"), {
		textContent: label,
	})

	const upBtn = Object.assign(document.createElement("input"), {
		type: "checkbox",
		textContent: "+",
		onclick: () => console.log("upvote"),
	})

	const downBtn = Object.assign(document.createElement("input"), {
		type: "checkbox",
		textContent: "-",
		onclick: () => console.log("downvote"),
	})

	container.append(span, upBtn, downBtn)
	return container
}

/**
 * @param {Answer} doc
 * @returns {HTMLDivElement}
 */
export const elAnswerVoteInput = (doc) => {
	const { _id, text, upvotes, downvotes } = doc
	const container = Object.assign(document.createElement("div"), {
		className: "vote-field",
	})

	const p = Object.assign(document.createElement("p"), {
		textContent: text,
	})

	// TODO may leave off to prevent voter bias
	// const countEl = Object.assign(document.createElement("span"), {
	// 	textContent: `(↑${upvotes.length} ↓${downvotes.length})`,
	// })

	const inputsWrap = Object.assign(document.createElement("div"), {
		className: "inputs",
	})

	/**
	 * @param {string} value
	 * @param {string} text
	 * */
	function checkboxLabel(value, text) {
		const name = `votes['${_id}']`
		return Object.assign(document.createElement("label"), {
			textContent: text,
			for: name,
			innerHTML: `<input type="radio" name="${name}" title="${value}" value="${value}"> ${text}`,
			// onclick: () => console.log(`answer-${_id}: ${value}`),
		})
	}

	const upBtn = checkboxLabel("upvote", "↑")
	const downBtn = checkboxLabel("downvote", "↓")

	inputsWrap.append(upBtn, downBtn)
	container.append(p, inputsWrap)
	return container
}

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
	})

	const docLinkEl = Object.assign(document.createElement("a"), {
		// className: "delete",
		// ariaLabel: `delete ${doc.typeof} item`,
		// title: `go to poll`,
		textContent: "question -->",
		href: `/${doc.typeof.toLowerCase()}/index.html?id=${doc._id}`,
	})

	const playLinkEl = Object.assign(document.createElement("a"), {
		// className: "delete",
		// ariaLabel: `delete ${doc.typeof} item`,
		// title: `go to poll`,
		textContent: "play -->",
		href: `/play/index.html?id=${doc._id}`,
	})

	p.append(docLinkEl, playLinkEl, deleteBtn)

	return p
}

/**
 * @param {Map<string, Question|Answer> | Array<Question|Answer>} mapOrArray
 * @param {HTMLElement} wrap
 * @param {(doc: RemoveObject) => Promise<void>} deleteFunc
 */
export async function renderAllTextEls(mapOrArray, wrap, deleteFunc) {
	const docs = (
		mapOrArray instanceof Map ? [...mapOrArray.values()] : mapOrArray
	).toReversed()

	if (!docs.length) {
		wrap.append(
			Object.assign(document.createElement("p"), {
				textContent: "No found, create new one",
			})
		)
		return
	}

	const nodes = docs.map((doc, i) => {
		return createTextEl(doc, deleteFunc, i * 80)
	})

	// Append all at once
	wrap.replaceChildren(...nodes)
}
