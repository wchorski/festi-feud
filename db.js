//? https://pouchdb.com/getting-started.html
/**
 * @typedef {import('./types/Answer').Answer} Answer
 * @typedef {import('./types/Response').Response} Response
 * @typedef {import('./types/RemoveObject').RemoveObject} RemoveObject
 * @typedef {import('./types/Answer').AnswerCreateTrans} AnswerCreateTrans
 * @typedef {import("./types/Answer").AnswerFormData} AnswerFormData
 * @typedef {import('./types/Question').Question} Question
 * @typedef {import('Vote').Ballot} Ballot
 * @typedef {import('Vote').BaseBallot} BaseBallot
 * @typedef {import('./types/Question').QuestionCreateTrans} QuestionCreateTrans
 * @typedef {import('./types/PouchDBChange').PouchDBChange} PouchDBChange
 */

import { getUserUUID } from "./uuid.js"
import { ENVS } from "./envs.js"
import { events, EVENT_TYPES } from "./utils/events.js"
const { DB_BALLOT_DELETE, DB_BALLOT_SET, DB_BALLOT_CHANGE } = EVENT_TYPES

if (!ENVS) throw new Error("check envs.js file")
const {
	DB_PROTOCOL,
	DB_USER,
	DB_PASSWORD,
	DB_COLLECTION_Q,
	DB_URL,
	DB_COLLECTION_A,
	DB_COLLECTION_B,
} = ENVS

/** @type {HTMLElement|null} */
let syncDom = null
if (typeof window !== "undefined" && typeof document !== "undefined") {
	syncDom = document.querySelector("#sync-state")
}

const dbQuestions = new PouchDB(DB_COLLECTION_Q, {
	//? creates database on remote CouchDB if none exists
	skip_setup: false,
	auth: { username: DB_USER, password: DB_PASSWORD },
})
const remoteQuestionsDbUrl = `${DB_PROTOCOL}://${DB_USER}:${DB_PASSWORD}@${DB_URL}/${DB_COLLECTION_Q}`
const dbAnswers = new PouchDB(DB_COLLECTION_A, {
	skip_setup: false,
	auth: { username: DB_USER, password: DB_PASSWORD },
})
const remoteAnswersDbUrl = `${DB_PROTOCOL}://${DB_USER}:${DB_PASSWORD}@${DB_URL}/${DB_COLLECTION_A}`
const dbBallots = new PouchDB(DB_COLLECTION_B, {
	skip_setup: false,
	auth: { username: DB_USER, password: DB_PASSWORD },
})
const remoteBallotDbUrl = `${DB_PROTOCOL}://${DB_USER}:${DB_PASSWORD}@${DB_URL}/${DB_COLLECTION_B}`
const opts = { live: true, retry: true }

/** @type {Map<string, Question>} */
export const questionsMap = new Map()
/** @type {Map<string, Answer>} */
export const answersMap = new Map()
/** @type {Map<string, Ballot>} */
export const ballotsMap = new Map()

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
function ini() {
	dbQuestions.replicate
		.from(remoteQuestionsDbUrl)
		.on("complete", function (info) {
			// then two-way, continuous, retriable sync
			syncDom?.setAttribute("data-sync-state", "connected")
			syncDom?.setAttribute("title", `cloud sync: ${"connected"}`)
			dbQuestions
				.sync(remoteQuestionsDbUrl, opts)
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
		.from(remoteAnswersDbUrl)
		.on("complete", function (info) {
			// then two-way, continuous, retriable sync
			syncDom?.setAttribute("data-sync-state", "connected")
			syncDom?.setAttribute("title", `cloud sync: ${"connected"}`)
			dbAnswers
				.sync(remoteAnswersDbUrl, opts)
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
					// TODO add to event ENUM
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

	dbBallots.replicate
		.from(remoteBallotDbUrl)
		.on("complete", function (info) {
			// then two-way, continuous, retriable sync
			syncDom?.setAttribute("data-sync-state", "connected")
			syncDom?.setAttribute("title", `cloud sync: ${"connected"}`)
			dbBallots
				.sync(remoteBallotDbUrl, opts)
				//typescript no like
				// .on("change", onSyncChange)
				.on("paused", onSyncPaused)
				.on("error", onSyncError)
		})
		.on("error", onSyncError)

	dbBallots
		.changes({
			since: "now",
			live: true,
			include_docs: true,
		})
		.on("change", (change) => {
			const { id, deleted, doc } = change

			if (deleted) {
				ballotsMap.delete(id)
				events.dispatchEvent(
					new CustomEvent(DB_BALLOT_DELETE, { detail: change.id })
				)
			} else {
				ballotsMap.set(id, doc)
				events.dispatchEvent(
					new CustomEvent(DB_BALLOT_SET, { detail: change.doc })
				)
			}

			// react to both delete and update
			events.dispatchEvent(
				new CustomEvent(DB_BALLOT_CHANGE, { detail: ballotsMap })
			)
		})
}

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
 * @param {string} [category]
 * @returns {Promise<Question[]|undefined>} Array of document objects
 */
export async function getAllQuestionDocs(category) {
	try {
		const res = await dbQuestions.find({
			selector: { approved: true, ...(category ? { category } : {}) },
			// TODO think of better rate limiting
			limit: 999,
		})
		const docs = /** @type{Question[]} */ (res.docs.flatMap((doc) => doc))

		// const res = await dbQuestions.allDocs({ include_docs: true })
		// const docs = /** @type{Question[]} */ (res.rows.flatMap((row) => row.doc))

		docs.forEach((doc) => {
			questionsMap.set(doc._id, doc)
		})

		return docs
	} catch (error) {
		console.log("dbEmoji.js getAllQuestionDocs: ", error)
	}
}
/**
 * Retrieves all documents ids from the database
 * @returns {Promise<string[]|undefined>} Array of document objects
 */
export async function getAllQuestionIds() {
	try {
		const res = await dbQuestions.allDocs({ include_docs: false })

		return res.rows.map((row) => row.id)
	} catch (error) {
		console.log("getAllQuestionIds: ", error)
		throw new Error("getAllQ IDS ERROR")
	}
}
/**
 *
 * @param {string} id
 * @returns {Promise<Question>}
 */
export async function dbGetQuestion(id) {
	try {
		/** @type {Question} */
		const doc = await dbQuestions.get(id)
		return doc
	} catch (err) {
		console.log(err)
		throw new Error("get doc error")
	}
}

/**
 * Retrieves all documents from the database
 * @returns {Promise<Answer[]|undefined>} Array of document objects
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
/**
 * @param {string} questionId
 * @returns {Promise<PouchDB.Find.FindResponse<Answer>>}
 */
export async function dbFindAnswersByQuestionId(questionId) {
	try {
		const res = await dbAnswers.find({
			selector: { questionId },
			// TODO think of better rate limiting
			limit: 9999,
			// fields: ["_id", "text"],
			// sort: ["_id"],
		})

		return /** @type {PouchDB.Find.FindResponse<Answer>} */ (res)
	} catch (err) {
		console.log(err)
		throw new Error("db find error")
	}
}
/**
 * @param {string} questionId
 * @returns {Promise<PouchDB.Find.FindResponse<Ballot>>}
 */
export async function dbFindBallotsByQuestionId(questionId) {
	try {
		const res = await dbBallots.find({
			selector: { questionId },
			// TODO better rate limit logic?
			limit: 99999,
			// fields: ["_id", "text"],
			// sort: ["_id"],
		})

		return /** @type {PouchDB.Find.FindResponse<Ballot>} */ (res)
	} catch (err) {
		console.log(err)
		throw new Error("db find error")
	}
}

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
 *  @param {AnswerCreateTrans} point
 */
export async function dbCreateAnswer(point) {
	// const { authorId } = point

	// TODO do i really need to validate again here?
	// if (!text) throw new Error("create validation: no text")

	// only used for validation (prevent double submissions)
	delete point.answers

	try {
		const res = await dbAnswers.post({
			...point,
			typeof: "Answer",
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

// TODO dbBallotCreate()
// /**
//  * @param {{voterId:string, question:Question, answers:Answer[], votes:AnswerFormData[], submittedAt:string}} data
//  */
// export async function dbVotePerQuestion(data) {
// 	try {
// 		//? used in transforms.getUUID()
// 		// const voterId = await getUserUUID()
// 		const { voterId, question, votes, answers } = data

// 		// TODO may comment out for debuging later
// 		// TODO do i need to validate here even tho i did in the form?
// 		if (question.voterIds.includes(voterId))
// 			throw new Error("One submission per voter")

// 		const questionRes = await dbQuestions.put({
// 			...question,
// 			voterIds: [...question.voterIds, voterId],
// 		})
// 		const answersRes = await dbAnswers.bulkDocs(
// 			votes.flatMap((vote) => {
// 				const foundAnswer = answers.find((a) => a._id === vote._id)
// 				if (!foundAnswer) return []
// 				return {
// 					...foundAnswer,
// 					_id: vote._id,
// 					...(vote.upvote
// 						? { upvotes: [...foundAnswer.upvotes, voterId] }
// 						: vote.downvote
// 						? { downvotes: [...foundAnswer.downvotes, voterId] }
// 						: {}),
// 				}
// 			})
// 		)

// 		console.log({ questionRes, answersRes })
// 		// TODO figure out good res for form
// 		// if(!questionRes.ok || answersRes.map)

// 		// return {
// 		// 	questionRes,
// 		// 	answersRes,
// 		// }
// 		return {
// 			ok: true,
// 			code: 202,
// 			questionRes,
// 			answersRes,
// 		}
// 	} catch (err) {
// 		console.log(err)
// 		throw new Error(`!!! dbVotePerQuestion: ${err}`)
// 	}
// }

/**
 *  @param {QuestionCreateTrans} point
 */
export async function dbCreateQuestion(point) {
	if (!point.text) throw new Error("data is not correct model shape")

	/** @type{QuestionCreateTrans & {typeof: "Question"}} */
	const doc = {
		...point,
		typeof: "Question",
		approved: false,
		category: point.category || "",
		tagIds: point.tagIds || [],
		voterIds: [],
	}

	try {
		const res = await dbQuestions.post(doc)

		if (!res.ok) throw new Error("create form save res not OK")

		return {
			...res,
			point: {
				...doc,
				_id: res.id,
				_rev: res.rev,
			},
		}
	} catch (error) {
		console.log("create error: ", error)
	}
}
/** @param {BaseBallot} point */
export async function dbCreateBallot(point) {
	console.log("💽 dbCreateBallot: ", point)
	if (!point.questionId || !point.voterId)
		throw new Error("data is not correct model shape")

	// VALIDATE if user has already voted on question
	const ballotDocsRes = await dbFindBallotsByQuestionId(point.questionId)
	const hasUserVoted = ballotDocsRes.docs
		.flatMap((doc) => doc.voterId)
		.includes(point.voterId)
	if (hasUserVoted) {
		throw new Error("User may only submit one ballot per question")
	}

	try {
		const res = await dbBallots.post({
			...point,
			typeof: "Ballot",
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

// /**
//  *
//  * @param {string} url
//  * @returns {Promise<string>}
//  */
// async function fetchCSS(url) {
// 	const response = await fetch(url)
// 	if (!response.ok) throw new Error("Failed to fetch CSS")
// 	return await response.text()
// }

/**
 * @param {RemoveObject} doc
 */
export async function dbDeleteAnswer(doc) {
	try {
		const res = await dbAnswers.remove(doc)
		if (!res.ok) throw new Error("delete res is not OK")
	} catch (error) {
		throw new Error("delete failed", { cause: error })
	}
}
/**
 * @param {RemoveObject} doc
 */
export async function dbDeleteQuestion(doc) {
	try {
		const res = await dbQuestions.remove(doc)
		if (!res.ok) throw new Error("delete res is not OK")
	} catch (error) {
		throw new Error("delete failed", { cause: error })
	}
}

export async function dbSeedDatabase() {
	try {
		/**
		 * @param {string} url
		 * @returns {Promise<Array<Question | Answer>>}
		 */
		const fetchAndProcess = async (url) => {
			const response = await fetch(url)
			/** @type {Array<Answer | Question>} */
			const docs = await response.json()
			//@ts-ignore - remove _rev if i forgot to take it out manually
			return docs.map(({ _rev, ...data }) => data)
		}

		/**
		 * @param {any[]} results
		 * @returns {number}
		 */
		const countErrors = (results) =>
			results.reduce((count, obj) => count + (obj.error ? 1 : 0), 0)
		/**
		 * @param {any[]} results
		 * @returns {boolean}
		 */
		const hasErrors = (results) => results.some((obj) => obj.error === true)

		const [questionDocs, answerDocs, ballotDocs] = await Promise.all([
			fetchAndProcess("/ini/questions-seed.json"),
			fetchAndProcess("/ini/answers-seed.json"),
			fetchAndProcess("/ini/ballots-seed.json"),
		])

		const [questionRes, answerRes, ballotRes] = await Promise.all([
			dbQuestions.bulkDocs(questionDocs),
			dbAnswers.bulkDocs(answerDocs),
			dbBallots.bulkDocs(ballotDocs),
		])

		if (
			hasErrors(questionRes) ||
			hasErrors(answerRes) ||
			hasErrors(ballotRes)
		) {
			const questionErrors = countErrors(questionRes)
			const answerErrors = countErrors(answerRes)
			const ballotErrors = countErrors(ballotRes)

			throw new Error(
				`🌱 Database already (or partially) seeded with data.\n` +
					`Question errors: ${questionErrors}/${questionRes.length}, ` +
					`Answer errors: ${answerErrors}/${answerRes.length}` +
					`Ballot errors: ${ballotErrors}/${ballotRes.length}`
			)
		}

		return {
			ok: true,
			message: `Database seeded with 
      ${answerRes.length} answers, 
      ${questionRes.length} questions, and 
      ${ballotRes.length} ballots`,
		}
	} catch (error) {
		return {
			error: true,
			message: error instanceof Error ? error.message : String(error),
		}
	}
}

/**
 * @param {Question[]} docs
 * @returns {Promise<Response>}
 */
export async function dbQuestionDeleteMany(docs) {
	try {
		const res = await dbQuestions.bulkDocs(
			docs.map((doc) => ({ ...doc, _deleted: true }))
		)
		// if(!res) throw new Error('db delete res not OK')
		return {
			ok: true,
			message: "All Docs have been marked as _deleted",
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
 * @param {Ballot[]} docs
 * @returns {Promise<Response>}
 */
export async function dbBallotsDeleteMany(docs) {
	console.log(docs)
	try {
		const res = await dbBallots.bulkDocs(
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
		const resAnswers = await dbAnswers.allDocs({ include_docs: true })
		await dbAnswersDeleteMany(resAnswers.rows.map((row) => row.doc))
		// await dbAnswersDeleteMany(aDocs)
		const res = await dbBallots.allDocs({ include_docs: true })
		await dbBallotsDeleteMany(res.rows.map((row) => row.doc))
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

// /**
//  * @returns {Promise<Response>}
//  */
// export async function dbEmojiDestroy() {
// 	try {
// 		const res = await dbQuestions.destroy()
// 		return {
// 			ok: true,
// 			message: "Database has been destroyed",
// 		}
// 	} catch (error) {
// 		console.log(error)
// 		return {
// 			error: true,
// 			message:
// 				error instanceof Error ? "Database not found" : "Database not found",
// 		}
// 	}
// }

document.addEventListener("DOMContentLoaded", () => {
	ini()
})
