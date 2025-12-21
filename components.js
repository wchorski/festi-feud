/**
 * @typedef {Object} ElementProps
 * @typedef {import('Question').Question} Question
 * @typedef {import('Question').QuestionSet} QuestionSet
 * @typedef {import('Question').QuestionCreateTrans} QuestionCreateTrans
 * @typedef {import('Question').QuestionDelete} QuestionDelete
 * @typedef {import("Answer").Answer} Answer
 * @typedef {import("GameState").GameAnswer} GameAnswer
 * @typedef {import("GameState").GameState} GameState
 * @typedef {import("Answer").AnswerSet} AnswerSet
 * @typedef {import("Answer").AnswerCreateTrans} AnswerCreateTrans
 * @typedef {import("Answer").AnswerDelete} AnswerDelete
 * @typedef {import("RemoveObject").RemoveObject} RemoveObject
 * @typedef {import("Vote").Ballot} Ballot
 * @typedef {function(string, Record<string, any>|null, ...(HTMLElement|string)[]): HTMLElement} CreateElement
 */
//! don't import anything relating to db in here

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

/**
 * @template {HTMLElement} T
 * @param {string} selector
 * @param {new () => T} type
 * @param {HTMLElement} [parentElement]
 * @returns {T}
 */
export function querySelector(selector, type, parentElement) {
	if (parentElement) {
		const el = parentElement.querySelector(selector)
		if (!el) throw new Error(`Element with selector "${selector}" not found`)
		return /** @type {T} */ (el)
	} else {
		const el = document.querySelector(selector)
		if (!el) throw new Error(`Element with selector "${selector}" not found`)
		return /** @type {T} */ (el)
	}
}
/**
 * @template {Element} T
 * @param {string} selector
 * @param {new () => T} type
 * @param {Element} [parentElement]
 * @returns {NodeListOf<T>}
 */
export function querySelectorAll(selector, type, parentElement) {
	if (parentElement) {
		const el = parentElement.querySelectorAll(selector)
		if (!el) throw new Error(`Element with selector "${selector}" not found`)
		return /** @type {NodeListOf<T>} */ (el)
	} else {
		const el = document.querySelectorAll(selector)
		if (!el) throw new Error(`Element with selector "${selector}" not found`)
		return /** @type {NodeListOf<T>} */ (el)
	}
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

// /**
//  * @param {number|undefined} prevIndex
//  * @param {number|undefined} nextIndex
//  * @param {Window|null} window
//  * */
// export function uiActiveTeam(prevIndex, nextIndex, window) {
// 	const prevTeamEl = window?.document.getElementById(`team-${prevIndex}`)
// 	const nextTeamEl = window?.document.getElementById(`team-${nextIndex}`)
// 	// TODO no like cuz index can be `undefined`
// 	// if (!prevTeamEl || !nextTeamEl) throw new Error("no prevTeamEl or prevTeamEl")
// 	if (prevTeamEl) prevTeamEl.classList.remove("active")
// 	if (nextTeamEl) nextTeamEl.classList.add("active")
// }

/**
 * @param {GameAnswer} gAnswer
 * @returns {HTMLElement}
 */
export function elGameAnswerForPopup(gAnswer) {
	const liEl = Object.assign(document.createElement("li"), {})
	const wrap = Object.assign(document.createElement("article"), {
		className: "answer card",
	})

	wrap.id = `gameanswer-${gAnswer.id}`

	const p = Object.assign(document.createElement("p"), {
		textContent: gAnswer.text,
	})
	wrap.append(p)

	const pointsSpanEl = Object.assign(document.createElement("span"), {
		textContent: gAnswer.points,
		className: "points",
	})
	wrap.append(pointsSpanEl)
	liEl.append(wrap)
	return liEl
	// <article class="answer">
	//   <p>Cooler with food and drinks that are spoiled</p>
	//   <span class="points">12</span>
	// </article>
}

// TODO don't need `isModeratorWindow` because of decoupled event signals
/**
 * @param {GameAnswer} gAnswer
 * @param {(checked: boolean) => any} onChange
 * @returns {HTMLElement}
 */
export const elGameAnswerModerator = (gAnswer, onChange) => {
	const wrap = Object.assign(document.createElement("li"), {
		className: "answer card",
	})

	wrap.id = `gameanswer-${gAnswer.id}`

	const p = Object.assign(document.createElement("p"), {
		textContent: gAnswer.text,
	})
	wrap.append(p)

	const pointsLabel = Object.assign(document.createElement("label"), {
		textContent: `${gAnswer.points} points`,
	})
	const pointsCheckbox = Object.assign(document.createElement("input"), {
		type: "checkbox",
		value: gAnswer.points,
	})
	pointsCheckbox.className = "points"

	pointsCheckbox.addEventListener(
		"change",
		/** @param {Event} e */
		(e) => {
			if (!(e.target instanceof HTMLInputElement))
				throw new Error("not input el")
			onChange(e.target.checked)
			// 		if (roundPhase !== "end") uiPointsDisplay(currentPoints)
			// gameStateManager.setIsGuessed(gAnswer.id, e.target.checked)
		}
	)

	pointsLabel.append(pointsCheckbox)
	wrap.append(pointsLabel)

	return wrap
}

/**
 * @param {Answer} anwr
 * @param {Ballot[]} ballots
 * @returns {HTMLDivElement}
 */
export const elAnswerVoteInput = (anwr, ballots) => {
	const { _id, text } = anwr

	const upvoteCount = ballots.filter((ballot) =>
		ballot.upvotes.includes(anwr._id)
	).length

	const downvoteCount = ballots.filter((ballot) =>
		ballot.downvotes.includes(anwr._id)
	).length

	const wrap = Object.assign(document.createElement("div"), {
		className: "vote-field",
	})

	const p = Object.assign(document.createElement("p"), {
		textContent: text,
	})

	// TODO may leave off to prevent voter bias
	const countEl = Object.assign(document.createElement("span"), {
		textContent: `(↑${upvoteCount} ↓${downvoteCount})`,
	})

	const inputsWrap = Object.assign(document.createElement("div"), {
		className: "inputs",
	})

	/**
	 * @param {string} value
	 * @param {string} text
	 * */
	function checkboxLabel(value, text) {
		const name = `answer['${_id}']`
		return Object.assign(document.createElement("label"), {
			textContent: text,
			for: name,
			innerHTML: `<input type="radio" name="${name}" title="${value}" value="${value}"> ${text}`,
			// onclick: () => console.log(`answer-${_id}: ${value}`),
		})
	}

	const upBtn = checkboxLabel("upvote", "↑")
	const downBtn = checkboxLabel("downvote", "↓")

	inputsWrap.append(countEl, upBtn, downBtn)
	wrap.append(p, inputsWrap)
	return wrap
}

/**
 * Add a single new message to the top of the container
 * @param {Question|Answer} doc
 * @param {(doc:RemoveObject) => Promise<void>} deleteFunc
 * @param {number} delay - animation start in ms
 */
export function createTextEl(doc, deleteFunc, delay = 80) {
	const wrap = Object.assign(document.createElement("div"), {
		// className: ["card", "anim-fade-in"].join(" "),
		className: ["card"].join(" "),
	})
	wrap.dataset.id = doc._id

	const p = Object.assign(document.createElement("p"), {
		textContent: doc.text + "  ",
	})
	p.style.animationDelay = `${delay}ms`

	const deleteBtn = Object.assign(document.createElement("button"), {
		className: "delete",
		ariaLabel: `delete ${doc.typeof} item`,
		title: `delete ${doc.typeof} item`,
		textContent: "x",
		onpointerup:
			doc.typeof === "Question" || doc.typeof === "Answer"
				? () => deleteFunc(doc)
				: console.log("typeof != Question || Answer"),
	})

	const navDocs = Object.assign(document.createElement("nav"), {
		className: "survey-nav",
	})
	const navDocList = Object.assign(document.createElement("ul"), {})

	if (doc.typeof === "Answer") {
		const navDocListItem2 = Object.assign(document.createElement("li"), {})
		const questionLinkEl = Object.assign(document.createElement("a"), {
			className: "btn",
			textContent: "Question",
			href: `/question/index.html?id=${doc.questionId}`,
		})
		navDocListItem2.append(questionLinkEl)
		navDocList.append(navDocListItem2)
	}

	const items = [
		{
			text: `Vote`,
			href: `/${doc.typeof.toLowerCase()}/index.html?id=${doc._id}`,
		},
		{
			text: "Play",
			href:
				doc.typeof === "Question"
					? `/play/index.html?id=${doc._id}&category=${doc.category}`
					: `/play/index.html?id=${doc._id}`,
		},
	]

	items.forEach(({ text, href }) => {
		const navDocListItem = Object.assign(document.createElement("li"), {})
		const docLinkEl = Object.assign(document.createElement("a"), {
			className: "btn",
			textContent: text,
			href,
		})

		navDocListItem.append(docLinkEl)
		navDocList.append(navDocListItem)
	})

	// const playLinkEl = Object.assign(document.createElement("a"), {
	// 	// className: "delete",
	// 	// ariaLabel: `delete ${doc.typeof} item`,
	// 	// title: `go to poll`,
	// 	textContent: "play -->",
	// 	href: `/play/index.html?id=${doc._id}`,
	// })

	navDocs.append(navDocList)
	// p.append(navDocs, deleteBtn)

	wrap.append(p, navDocs, deleteBtn)

	return wrap
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
