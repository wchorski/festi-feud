/**
 * @typedef {import("Vote").BaseBallot & { _id: string, typeof: "Ballot",}} BaseBallotWithId
 */
/**
 * Family Feud HTML → JSON parser
 * Usage:
 *   node parse-feud.js input.html output.json
 */

import fs from "fs"
import { JSDOM } from "jsdom"

const args = process.argv.slice(2) // everything after "node script.js"

let inputFile = ""
let outputFile = "./ini/out/feud-data.json"

// simple parser for inputFile=...
args.forEach((arg) => {
	if (arg.startsWith("inputFile=")) {
		inputFile = arg.split("=")[1]
	}
	if (arg.startsWith("outputFile=")) {
		outputFile = arg.split("=")[1]
	}
})

if (!inputFile || !outputFile) throw new Error("no input our output set")

if (!inputFile) {
	console.error("Usage: node parse-feud.js input.html output.json")
	process.exit(1)
}
// console.log(inputFile)
const html = fs.readFileSync(inputFile, "utf8")
// console.log(html)
const dom = new JSDOM(html)
const document = dom.window.document

const ols = [...document.querySelectorAll("ol.wp-block-list")]

const questionsMaster = []
const answersMaster = []
const ballotsMaster = []

for (const ol of ols) {
	const start = ol.getAttribute("start")
	const li = ol.querySelector("li")
	if (!start || !li) continue

	const questionText = li.textContent.trim()
	const p = ol.nextElementSibling
	if (!p || p.tagName !== "P") continue

	const rawAnswers = p.innerHTML
		.replace(/<a[^>]*>.*?<\/a>/gi, "") // remove links
		.split(/<br\s*\/?>/i) // split on <br>
		.map(
			(a) =>
				a
					.replace(/&nbsp;/g, " ") // replace non-breaking spaces
					.replace(/[\n\t]+/g, " ") // replace newlines/tabs with a space
					.trim() // remove extra spaces at ends
		)
		.filter(Boolean) // remove empty strings

	// console.log(JSON.stringify({ rawAnswers }, null, 2))

	const answers = rawAnswers
		.map((a) => {
			const match = a.match(/^(.*)\s*\((\d+)\)$/) // allow optional space before parentheses
			if (!match) return null
			return {
				text: match[1].trim(),
				points: Number(match[2]),
			}
		})
		.filter((a) => a !== null)

	// console.log(JSON.stringify({ answers }, null, 2))

	if (rawAnswers.length !== answers.length)
		throw new Error("rawAnswers.length !== answers.length")

	const totalRawPoints = answers.reduce((sum, answer) => sum + answer.points, 0)

	const scaledAnswers = answers.map((a) => ({
		text: a.text,
		points: Math.round((a.points / totalRawPoints) * 100),
	}))

	const totalScaledPoints = scaledAnswers.reduce(
		(sum, answer) => sum + answer.points,
		0
	)
	// console.log({ totalScaledPoints })

	if (totalScaledPoints < 98 || totalScaledPoints > 102) {
		throw new Error(
			`Total points ${totalScaledPoints} is out of expected range (98–101).`
		)
	}

	questionsMaster.push({
		_id: `Question-family-${start}`,
		typeof: "Question",
		text: questionText,
		dateCreated: "2025-12-20T22:01:38.191Z",
		authorId: "User-admin",
		category: "best-of-family",
		tagIds: [],
		approved: true,
	})
	answersMaster.push(
		...answers.map((anwr, i) => ({
			_id: `Answer-family-q${start}-${i}`,
			typeof: "Answer",
			text: anwr.text,
			questionId: `Question-family-${start}`,
			dateCreated: "2025-12-20T22:01:38.191Z",
			authorId: "User-admin",
		}))
	)
	ballotsMaster.push(
		...generateBallots(
			`Question-family-${start}`,
			start,
			answers.map((anwr, i) => ({ ...anwr, _id: `Answer-family-q${start}-${i}`, }))
		)
	)
}

fs.writeFileSync(
	"./ini/out/top-family-feud-answers.json",
	JSON.stringify(answersMaster, null, 2)
)
fs.writeFileSync(
	"./ini/out/top-family-feud-questions.json",
	JSON.stringify(questionsMaster, null, 2)
)
fs.writeFileSync(
	"./ini/out/top-family-feud-ballots.json",
	JSON.stringify(ballotsMaster, null, 2)
)
console.log("done")
// console.log(`✔ Generated ${feuds.length} questions → ${outputFile}`)

/**
 * Generate 100 ballots for a given question so that total upvotes match points
 * @param {string} questionId
 * @param {string} questionIndex
 * @param {{_id:string, text: string, points: number}[]} answers
 * @param {number} totalBallots
 * @returns {BaseBallotWithId[]}
 */
function generateBallots(
	questionId,
	questionIndex,
	answers,
	totalBallots = 100
) {
	/** @type {BaseBallotWithId[]} */
	const ballots = []

	// expand each answer into an array containing its "points" number of votes
	/** @type{string[]} */
	const allVotes = []
	answers.forEach((answer) => {
		for (let i = 0; i < answer.points; i++) {
			allVotes.push(answer._id)
		}
	})

	// shuffle votes to randomize
	for (let i = allVotes.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1))
		;[allVotes[i], allVotes[j]] = [allVotes[j], allVotes[i]]
	}

	// distribute votes evenly across ballots
	for (let i = 0; i < totalBallots; i++) {
		ballots.push({
			_id: `Ballot-family-q${questionIndex}-${i}`,
			typeof: "Ballot",
			voterId: `voter-${i + 1}`,
			questionId,
			dateCreated: new Date().toISOString(),
			upvotes: [],
			downvotes: [],
		})
	}

	// round-robin assignment of votes to ballots
	allVotes.forEach((vote, idx) => {
		const ballotIndex = idx % totalBallots
		ballots[ballotIndex].upvotes.push(vote)
	})

	return ballots
}
