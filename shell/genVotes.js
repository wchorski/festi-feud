/**
 * @typedef {import("Vote").Ballot} Ballot
 */
import fs from "fs/promises"
import { ENVS } from "../envs.js"

async function fetchAnswers() {
	const { DB_PROTOCOL, DB_USER, DB_PASSWORD, DB_URL, DB_COLLECTION_A } = ENVS
	const ENDPOINT = "_all_docs"
	// const answers = await getAllAnswerDocs()
	// https://docs.couchdb.org/en/stable/api/database/bulk-api.html
	const url = `${DB_PROTOCOL}://${DB_URL}/${DB_COLLECTION_A}/${ENDPOINT}?include_docs=true`

	try {
		const res = await fetch(url, {
			headers: {
				Authorization: "Basic " + btoa(`${DB_USER}:${DB_PASSWORD}`),
				"Content-Type": "application/json",
			},
		})
		// console.log(res);
		/** @type {{rows: { doc: import("Answer").Answer}[]}} */
		const data = await res.json()
		return data.rows.map((row) => row.doc)
	} catch (error) {
		console.log(error)
		throw new Error(String(error))
	}
}

async function fetchQuestion() {
	const { DB_PROTOCOL, DB_USER, DB_PASSWORD, DB_URL, DB_COLLECTION_Q } = ENVS
	const ENDPOINT = "_all_docs"
	// const answers = await getAllAnswerDocs()
	// https://docs.couchdb.org/en/stable/api/database/bulk-api.html
	const url = `${DB_PROTOCOL}://${DB_URL}/${DB_COLLECTION_Q}/${ENDPOINT}?include_docs=true`

	try {
		const res = await fetch(url, {
			headers: {
				Authorization: "Basic " + btoa(`${DB_USER}:${DB_PASSWORD}`),
				"Content-Type": "application/json",
			},
		})
		// console.log(res);
		/** @type {{rows: { doc: import("Question").Question}[]}} */
		const data = await res.json()
		return data.rows.map((row) => row.doc)
	} catch (error) {
		console.log(error)
		throw new Error(String(error))
	}
}

async function dbGenerateRandomVotes() {
	// i could create a view to filter directly from db http://127.0.0.1:5984/_utils/#/database/answers/new_view
	// BUUTTT i can just filter from here because I need to get all answers anyway
	const answerDocs = await fetchAnswers()
	const questionDocs = await fetchQuestion()
	/** @type{Ballot[]} */
	const ballots = []

	questionDocs.map((question, index) => {
		console.log(question)
		const surveyAnswers = answerDocs.filter(
			(doc) => doc.questionId === question._id
		)
		console.log("surveyAnswers.length: ", surveyAnswers.length)

		// TODO make this 100 for more realistic numbers
		Array(3)
			.fill("x")
			.forEach((_, i) => {
				/** @type{string[]} */
				const upvotes = []
				/** @type{string[]} */
				const downvotes = []

				surveyAnswers.map((anw) => {
					switch (rndVotes()) {
						case "upvote":
							upvotes.push(anw._id)
							break
						case "downvote":
							downvotes.push(anw._id)
							break
					}
				})

				ballots.push({
					typeof: "Ballot",
					_id: `BAD_ID`,
					voterId: `User-${i}`,
					questionId: question._id,
					upvotes,
					downvotes,
				})
			})
	})

	const fixBallotIds = ballots.map((doc, i) => ({ ...doc, _id: "Ballot-" + i }))
	await fs.writeFile(
		"ini/out/ballots-seed.json",
		JSON.stringify(fixBallotIds, null, 2)
	)
	const fixQuestionIds = questionDocs.map((doc, i) => ({
		...doc,
		_id: "Question-" + i,
		authorId: "User-admin",
		voterIds: ["User-1", "User-2", "User-3"],
	}))
	await fs.writeFile(
		"ini/out/questions-seed.json",
		JSON.stringify(fixQuestionIds, null, 2)
	)
	// const fixAnswersIds = answerDocs.map((doc, i) => ({ ...doc, _id: "Answer-" + i }))
	// await fs.writeFile("ini/out/answer-seed.json", JSON.stringify(fixAnswersIds, null, 2))

	console.log("Data saved to output.json")
}

function rndVotes() {
	const randNum = Math.random()

	switch (true) {
		case randNum > 0.4:
			return "upvote"
		case randNum < 0.4 && randNum > 0.2:
			return "no-vote"
		default:
			return "downvote"
	}
}

dbGenerateRandomVotes()

// used temporarily to fix stale model
async function remodelAnswers() {
	const docs = await fetchAnswers()

	const remodeled = docs.map((doc, i) => {
		const { questionId, authorId, dateCreated, text } = doc
		return {
			_id: `Answer-${i}`,
			typeof: "Answer",
			questionId,
			authorId,
			dateCreated,
			text,
			ballotIds: [],
		}
	})

	await fs.writeFile("ini/output.json", JSON.stringify(remodeled, null, 2))
	console.log("Data saved to output.json")
}

// remodelAnswers()
