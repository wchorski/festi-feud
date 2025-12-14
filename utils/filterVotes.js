/**
 * @typedef {import("Answer").Answer} Answer
 * @typedef {import("Vote").Ballot} Ballot
 * @typedef {import("GameState").GameAnswer} GameAnswer
 */

//! TODO remove later, doesn't work with new scoring ballot system
// /** @param {GameAnswer[]} gAnswer */
// export function votesFilterSortAndSliceEight(gAnswer) {
// 	return gAnswer
// 		.filter((answer) => answer.points >= 0)
// 		.sort((a, b) => b.points - a.points)
// 		.slice(0, 8)
// }

// /**
//  * @param {Answer} anwr
//  * @param {Ballot[]} ballots
//  *  */
// export function calcAnswerPoints(anwr, ballots) {
// 	const upvoteCount = ballots.filter((ballot) =>
// 		ballot.upvotes.includes(anwr._id)
// 	).length

// 	const downvoteCount = ballots.filter((ballot) =>
// 		ballot.downvotes.includes(anwr._id)
// 	).length
// 	const votesSum = Math.max(upvoteCount - downvoteCount, 0)
// 	// calc percentage because each survey can have a wide range of voters.
// 	return totalVotesSum > 0 ? Math.round((votesSum / totalVotesSum) * 100) : 0
// }

// /**
//  * @param {Answer[]} docs
//  * @param {Ballot[]} ballots
//  */
// export function convertAnswersToGame(docs, ballots) {
// 	const votesSum = docs.reduce(
// 		(count, doc) =>
// 			count + Math.max(doc.upvotes.length - doc.downvotes.length, 0),
// 		0
// 	)

// 	return docs.map((doc) => ({
// 		id: doc._id,
// 		text: doc.text,
// 		points: calcAnswerPoints(doc, votesSum),
// 		isGuessed: false,
// 	}))
// }

/**
 * @param {string} questionId
 * @param {Ballot[]} ballots
 * @param {Answer[]} answers
 * @returns {GameAnswer[]}
 *  */
export function gameAnswersTop8(questionId, ballots, answers) {
	ballots.forEach((ballot) => {
		if (ballot.questionId !== questionId)
			throw new Error("ballot.questionId !== quetionId")
	})
	answers.forEach((answers) => {
		if (answers.questionId !== questionId)
			throw new Error("answers.questionId !== quetionId")
	})

	// Step 1: Count upvotes and downvotes for each answer
	const answerStats = new Map()
	const uniqueVoters = new Set()

	for (const ballot of ballots) {
		uniqueVoters.add(ballot.voterId)

		// Count upvotes
		for (const answerId of ballot.upvotes) {
			const stats = answerStats.get(answerId) || { upvotes: 0, downvotes: 0 }
			stats.upvotes++
			answerStats.set(answerId, stats)
		}

		// Count downvotes
		for (const answerId of ballot.downvotes) {
			const stats = answerStats.get(answerId) || { upvotes: 0, downvotes: 0 }
			stats.downvotes++
			answerStats.set(answerId, stats)
		}
	}

	// Step 2: Create lookup map for answers
	const answerMap = new Map(answers.map((a) => [a._id, a]))

	// Step 3: Calculate net score and sort
	const rankedAnswers = Array.from(answerStats.entries())
		.map(([_id, stats]) => ({
			_id,
			answer: answerMap.get(_id),
			upvotes: stats.upvotes,
			downvotes: stats.downvotes,
			netScore: stats.upvotes - stats.downvotes,
			popularity:
				uniqueVoters.size > 0
					? Math.max(0, (stats.upvotes - stats.downvotes) / uniqueVoters.size)
					: 0,
		}))
		.filter((a) => a.netScore > 0 && a.answer)
		.sort((a, b) => b.netScore - a.netScore)
		.slice(0, 8)

	// Step 4: Scale top 8 to 100 points
	const totalNetScore = rankedAnswers.reduce((sum, a) => sum + a.netScore, 0)

	const scaledAnswers = rankedAnswers.map((ranked) => ({
		id: ranked._id,
		text: ranked.answer?.text || "",
		authorId: ranked.answer?.authorId || "",
		upvotes: ranked.upvotes,
		downvotes: ranked.downvotes,
		isGuessed: false,
		netScore: ranked.netScore,
		points: Math.round((ranked.netScore / totalNetScore) * 100),
		popularity: ranked.popularity,
    // TODO LAZY do i really need to add this onto each GameAnswer?
		uniqueVoterNum: uniqueVoters.size,
	}))

	return scaledAnswers
}
