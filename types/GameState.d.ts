export type GameState = {
	round: number
	points: number
	teams: Team[]
	activeTeamIndex: number
	strikes: number
	answers: Answer[]
	revealedAnswers: Set<number>
}

export type Team = {
	name: string
	score: number
}
export type Answer = {
	text: string
	points: number
}

/**
 * @typedef {Object} Answer
 * @property {string} text
 * @property {number} points
 */

/**
 * @typedef {Object} Team
 * @property {string} name
 * @property {number} score
 */

/**
 * @typedef {Object} GameState
 * @property {number} round
 * @property {number} points
 * @property {Team[]} teams
 * @property {number} activeTeamIndex
 * @property {number} strikes
 * @property {Answer[]} answers
 * @property {Set<number>} revealedAnswers
 */
