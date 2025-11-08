/**
 * @typedef {import("types/Answer.js").Answer} Answer
 * @typedef {import("types/GameState").GameAnswer} GameAnswer
 */

/** @param {GameAnswer[]} gAnswer */
export function filterAndSortVotes(gAnswer) {
	// take these objects and re-order depending on a score.
	return gAnswer
  // TODO only needed this when converting raw Answers from db
		// .map((gA) => ({
		// 	...gA,
		// 	score: calcAnswerPoints(gA),
		// }))
		.filter((answer) => answer.points >= 0)
		.sort((a, b) => b.points - a.points)
	// the score is determined by upvotes - downvotes

	//if score is negative remove completely (or don't include in array)

	// sort array by highest score first
}

/** @param {Answer} doc  */
export function calcAnswerPoints(doc) {
  // TODO there shouldn't be any answers with less than 1 point, but it is possible
  return Math.max(doc.upvotes.length - doc.downvotes.length, 0)
}

/** @param {Answer[]} docs */
export function convertAnswersToGame(docs) {
  return docs.map(doc => ({
    id: doc._id,
    text: doc.text,
    points: calcAnswerPoints(doc),
    isGuessed: false,
  }))
}