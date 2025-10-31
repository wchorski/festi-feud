/**
 * @typedef {import("types/Answer.js").Answer} Answer
 */

/** @param{Answer[]} docs */
export function filterAndSortVotes(docs) {
	// take these objects and re-order depending on a score.
	return docs
		.map((doc) => ({
			...doc,
			score: doc.upvotes.length - doc.downvotes.length,
		}))
		.filter((answer) => answer.score >= 0)
		.sort((a, b) => b.score - a.score)
	// the score is determined by upvotes - downvotes

	//if score is negative remove completely (or don't include in array)

	// sort array by highest score first
}
