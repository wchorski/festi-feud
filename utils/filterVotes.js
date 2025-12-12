/**
 * @typedef {import("Answer").Answer} Answer
 * @typedef {import("GameState").GameAnswer} GameAnswer
 */

/** @param {GameAnswer[]} gAnswer */
export function votesFilterSortAndSliceEight(gAnswer) {
	return gAnswer
		.filter((answer) => answer.points >= 0)
		.sort((a, b) => b.points - a.points)
		.slice(0, 8)
}

/**
 * @param {Answer} doc
 * @param {number} totalVotesSum
 *  */
export function calcAnswerPoints(doc, totalVotesSum) {
	const votesSum = Math.max(doc.upvotes.length - doc.downvotes.length, 0)
	// calc percentage because each survey can have a wide range of voters.
	return totalVotesSum > 0 ? Math.round((votesSum / totalVotesSum) * 100) : 0
}

/** @param {Answer[]} docs */
export function convertAnswersToGame(docs) {
	const answersLength = docs.length
	const votesSum = docs.reduce(
		(count, doc) =>
			count + Math.max(doc.upvotes.length - doc.downvotes.length, 0),
		0
	)
	console.log({ answersLength, votesSum })

	// total number of votes?

	return docs.map((doc) => ({
		id: doc._id,
		text: doc.text,
		points: calcAnswerPoints(doc, votesSum),
		isGuessed: false,
	}))
}
