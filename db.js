//? https://pouchdb.com/getting-started.html
/**
 * @typedef {import('./types/Answer').Answer} Answer
 * @typedef {import('./types/Response').Response} Response
 * @typedef {import('./types/RemoveObject').RemoveObject} RemoveObject
 * @typedef {import('./types/Answer').AnswerCreate} AnswerCreate
 * @typedef {import('./types/Question').Question} Question
 * @typedef {import('./types/Question').QuestionCreate} QuestionCreate
 * @typedef {import('./types/PouchDBChange').PouchDBChange} PouchDBChange
 */

import { ENVS } from "./envs.js"
import { events } from "./events.js"

if (!ENVS) throw new Error("check envs.js file")
const {
	DB_PROTOCOL,
	DB_USER,
	DB_PASSWORD,
	DB_COLLECTION_Q,
	DB_URL,
	DB_COLLECTION_A,
} = ENVS

const syncDom = document.querySelector("#sync-state")

const dbQuestions = new PouchDB(DB_COLLECTION_Q, {
	//? creates database on remote CouchDB if none exists
	skip_setup: false,
	auth: { username: DB_USER, password: DB_PASSWORD },
})
const remoteQuestionsDB = `${DB_PROTOCOL}://${DB_USER}:${DB_PASSWORD}@${DB_URL}/${DB_COLLECTION_Q}`
const dbAnswers = new PouchDB(DB_COLLECTION_A)
const remoteAnswersDbUrl = `${DB_PROTOCOL}://${DB_URL}/${DB_COLLECTION_A}`
const opts = { live: true, retry: true }

/** @type {Map<string, Question>} */
export const questionsMap = new Map()
/** @type {Map<string, Answer>} */
export const answersMap = new Map()

// TODO have client login to play game
// // Client logs in with username/password
// async function login(username, password) {
//   const response = await fetch('https://couchdb.mydomain.site/_session', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ name: username, password: password })
//   });
//   // CouchDB returns a session cookie
//   return response.json();
// }

//? https://pouchdb.com/api.html#sync
// do one way, one-off sync from the server until completion
dbQuestions.replicate
	.from(remoteAnswersDbUrl)
	.on("complete", function (info) {
		// then two-way, continuous, retriable sync
		syncDom?.setAttribute("data-sync-state", "connected")
		syncDom?.setAttribute("title", `cloud sync: ${"connected"}`)
		dbQuestions
			.sync(remoteAnswersDbUrl, opts)
			//typescript no like
			// .on("change", onSyncChange)
			.on("paused", onSyncPaused)
			.on("error", onSyncError)
	})
	.on("error", onSyncError)

dbQuestions
	.changes({
		since: "now",
		live: true,
		include_docs: true,
	})
	.on("change", (change) => {
		const { id, deleted, doc } = change

		if (deleted) {
			questionsMap.delete(id)
			events.dispatchEvent(
				new CustomEvent("questions:delete", { detail: change.id })
			)
		} else {
			questionsMap.set(id, doc)
			events.dispatchEvent(
				new CustomEvent("questions:set", { detail: change.doc })
			)
		}

		// react to both delete and update
		events.dispatchEvent(
			new CustomEvent("questions:change", { detail: questionsMap })
		)
	})

dbAnswers.replicate
	.from(remoteQuestionsDB)
	.on("complete", function (info) {
		// then two-way, continuous, retriable sync
		syncDom?.setAttribute("data-sync-state", "connected")
		syncDom?.setAttribute("title", `cloud sync: ${"connected"}`)
		dbAnswers
			.sync(remoteQuestionsDB, opts)
			//typescript no like
			// .on("change", onSyncChange)
			.on("paused", onSyncPaused)
			.on("error", onSyncError)
	})
	.on("error", onSyncError)

dbAnswers
	.changes({
		since: "now",
		live: true,
		include_docs: true,
	})
	.on("change", (change) => {
		const { id, deleted, doc } = change

		if (deleted) {
			answersMap.delete(id)
			events.dispatchEvent(
				new CustomEvent("answers:delete", { detail: change.id })
			)
		} else {
			answersMap.set(id, doc)
			events.dispatchEvent(
				new CustomEvent("answers:set", { detail: change.doc })
			)
		}

		// react to both delete and update
		events.dispatchEvent(
			new CustomEvent("answers:change", { detail: answersMap })
		)
	})

// /**@param {PouchDBChange} data */
// function onSyncChange(data) {
// 	syncDom?.setAttribute("data-sync-state", "syncing")
// }
function onSyncPaused() {
	// console.log("onSyncPaused")
	syncDom?.setAttribute("data-sync-state", "paused")
	syncDom?.setAttribute("title", `cloud sync: ${"idle"}`)
}

/**
 *  @param {any} error
 *  @return {void}
 */
function onSyncError(error) {
	if (error) {
		syncDom?.setAttribute("data-sync-state", "error")
		syncDom?.setAttribute("title", `cloud sync: ${"error"}`)
		// console.log("DB SYNC ERROR: ", error)
	}
}

/**
 * Retrieves all documents from the database
 * @returns {Promise<Answer[]|undefined>} Array of document objects
 */
export async function getAllQuestionDocs() {
	try {
		const res = await dbQuestions.allDocs({ include_docs: true })

		res.rows.forEach((row) => {
			questionsMap.set(row.id, row.doc)
		})

		return res.rows.map((row) => row.doc)
	} catch (error) {
		console.log("dbEmoji.js getAllQuestionDocs: ", error)
	}
}
/**
 * Retrieves all documents from the database
 * @returns {Promise<Question[]|undefined>} Array of document objects
 */
export async function getAllAnswerDocs() {
	try {
		const res = await dbAnswers.allDocs({ include_docs: true })

		res.rows.forEach((row) => {
			answersMap.set(row.id, row.doc)
		})

		return res.rows.map((row) => row.doc)
	} catch (error) {
		console.log("db.js getAllAnswerDocs: ", error)
	}
}
// getAllDocs()

/**
 *
 * @param {Question[]} docs
 */
async function dbCreateManyQuestions(docs) {
	try {
		const result = await dbQuestions.bulkDocs(docs)
		console.log(result)
	} catch (err) {
		console.log(err)
	}
}

// /**
//  *  @param {string} name
//  *  @param {SVGElement} svg
//  */
// async function createEmojiPoint(name, svg) {
// 	// 1. remove id
// 	svg.removeAttribute("id")
// 	// 2. add style from `parts.css` as <def> <style> in svg
// 	const css = await fetchCSS("/parts.css")
// 	let defs = svg.querySelector("defs")
// 	if (!defs) {
// 		defs = document.createElementNS("http://www.w3.org/2000/svg", "defs")
// 		svg.insertBefore(defs, svg.firstChild)
// 	}
// 	const style = document.createElementNS("http://www.w3.org/2000/svg", "style")
// 	style.setAttribute("type", "text/css")
// 	style.textContent = css
// 	defs.appendChild(style)
// 	const svgString = new XMLSerializer().serializeToString(svg)

// 	/** @type {NewEmoji} */
// 	const point = {
// 		//? if using put instead of post set _id
// 		// _id: new Date().toISOString(),
// 		date: new Date().toISOString(),
// 		name,
// 		svg: svgString,
// 	}

// 	if (!point.date || !point.name || !point.svg)
// 		throw new Error("data is not correct model shape")

// 	return point
// }

/**
 *  @param {AnswerCreate} point
 */
export async function createAnswer(point) {
	if (!point.text)
		throw new Error("create validation: data is not correct model shape")

	try {
		const res = await dbAnswers.post({
      ...point,
      questionId: point.questionId || "",
      votes: 1,
    })

		if (!res.ok) throw new Error("form save res not OK")

		return {
			...res,
			point: {
				...point,
				_id: res.id,
				_rev: res.rev,
			},
		}
	} catch (error) {
		console.log("createAnswer error: ", error)
	}
}

/**
 *  @param {QuestionCreate} point
 */
export async function createQuestion(point) {
	if (!point.text) throw new Error("data is not correct model shape")

	try {
		const res = await dbQuestions.post({
			...point,
			categoryId: point.categoryId || "",
			tagIds: point.tagIds || [],
		})

		if (!res.ok) throw new Error("create form save res not OK")

		return {
			...res,
			point: {
				...point,
				_id: res.id,
				_rev: res.rev,
			},
		}
	} catch (error) {
		console.log("create error: ", error)
	}
}

// /** @param {string} svg  */
// function renderSVG(svg) {
// 	const parser = new DOMParser()
// 	const doc = parser.parseFromString(svg, "image/svg+xml")
// 	const svgElement = doc.documentElement

// 	if (svgElement.tagName === "svg") {
// 		// Insert into DOM safely
// 		document.getElementById("emojis-wrap")?.appendChild(svgElement)
// 	}
// }

/**
 *
 * @param {string} url
 * @returns {Promise<string>}
 */
async function fetchCSS(url) {
	const response = await fetch(url)
	if (!response.ok) throw new Error("Failed to fetch CSS")
	return await response.text()
}

/**
 * @param {RemoveObject} doc
 */
export async function deleteMessage(doc) {
	try {
		const res = await dbAnswers.remove(doc)
		if (!res.ok) throw new Error("deleteMessage res is not OK")
	} catch (error) {
		throw new Error("deleteMessage failed", { cause: error })
	}
}
/**
 * @param {RemoveObject} doc
 */
export async function deleteEmoji(doc) {
	try {
		const res = await dbQuestions.remove(doc)
		if (!res.ok) throw new Error("dbEmoji res is not OK")
	} catch (error) {
		throw new Error("dbEmoji failed", { cause: error })
	}
}

// export async function dbSeedDatabase() {
// 	try {
// 		/**
// 		 * @param {string} url
// 		 * @returns {Promise<Array<NewEmoji | QuestionCreate>>}
// 		 */
// 		const fetchAndProcess = async (url) => {
// 			const response = await fetch(url)
// 			/** @type {Array<Emoji | Question>} */
// 			const docs = await response.json()
// 			return docs.map(({ _rev, ...data }) => data)
// 		}

// 		/**
// 		 * @param {any[]} results
// 		 * @returns {number}
// 		 */
// 		const countErrors = (results) =>
// 			results.reduce((count, obj) => count + (obj.error ? 1 : 0), 0)
// 		/**
// 		 * @param {any[]} results
// 		 * @returns {boolean}
// 		 */
// 		const hasErrors = (results) => results.some((obj) => obj.error === true)

// 		const [emojiDocs, messageDocs] = await Promise.all([
// 			fetchAndProcess("/public/ini/emojis-seed.json"),
// 			fetchAndProcess("/public/ini/messages-seed.json"),
// 		])

// 		const [emojiRes, messagesRes] = await Promise.all([
// 			dbQuestions.bulkDocs(emojiDocs),
// 			dbAnswers.bulkDocs(messageDocs),
// 		])

// 		if (hasErrors(emojiRes) || hasErrors(messagesRes)) {
// 			const emojiErrors = countErrors(emojiRes)
// 			const messageErrors = countErrors(messagesRes)

// 			throw new Error(
// 				`🌱 Database already (or partially) seeded with data.\n` +
// 					`Emoji errors: ${emojiErrors}/${emojiRes.length}, ` +
// 					`Message errors: ${messageErrors}/${messagesRes.length}`
// 			)
// 		}

// 		return {
// 			ok: true,
// 			message: `Database seeded with ${messagesRes.length} messages and ${emojiRes.length} emojis`,
// 		}
// 	} catch (error) {
// 		return {
// 			error: true,
// 			message: error instanceof Error ? error.message : String(error),
// 		}
// 	}
// }

/**
 * Seeds the database with emoji data
 * @param {Question[]} docs
 * @returns {Promise<Response>} The result of the seeding operation
 */
export async function dbQuestionDeleteMany(docs) {
	try {
		const res = await dbQuestions.bulkDocs(
			docs.map((doc) => ({ ...doc, _deleted: true }))
		)
		// if(!res) throw new Error('db delete res not OK')
		return {
			ok: true,
			message: "All Emoji Docs have been marked as _deleted",
		}
	} catch (error) {
		console.log(error)
		// const seedError = new Error("seedDatabase failed", { cause: error })
		// console.error(seedError)
		return {
			error: true,
			message:
				error instanceof Error ? "Database not found" : "Database not found",
		}
	}
}
/**
 * @param {Answer[]} docs
 * @returns {Promise<Response>}
 */
export async function dbAnswersDeleteMany(docs) {
	console.log(docs)
	try {
		const res = await dbAnswers.bulkDocs(
			docs.map((doc) => ({ ...doc, _deleted: true }))
		)
		// if(!res.ok) throw new Error('db delete res not OK')
		return {
			ok: true,
			message: "All Message Docs have been marked as _deleted",
		}
	} catch (error) {
		console.log(error)
		return {
			error: true,
			message:
				error instanceof Error ? "Database not found" : "Database not found",
		}
	}
}
/**
 *
 * @param {Question[]} qDocs
 * @param {Answer[]} aDocs
 */
export async function dbDeleteAllDocs(qDocs, aDocs) {
	try {
		await dbQuestionDeleteMany(qDocs)
		await dbAnswersDeleteMany(aDocs)
		return {
			ok: true,
			message: "Database: All Docs have been marked as _deleted",
		}
	} catch (error) {
		console.log(error)
		return {
			error: true,
			message:
				error instanceof Error ? "Database not found" : "Database not found",
		}
	}
}

/**
 * @returns {Promise<Response>}
 */
export async function dbEmojiDestroy() {
	try {
		const res = await dbQuestions.destroy()
		return {
			ok: true,
			message: "Database has been destroyed",
		}
	} catch (error) {
		console.log(error)
		return {
			error: true,
			message:
				error instanceof Error ? "Database not found" : "Database not found",
		}
	}
}
