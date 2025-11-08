/**
 * @typedef {import('../types/GameState.js').GameState} GameState
 * @typedef {import('../types/GameState.js').Team} Team
 * @typedef {import('../types/GameState.js').GameAnswer} Answer
 * @typedef {import('../types/EventDetails.js').TeamRenamedDetail} TeamRenamedDetail
 */
import { events, EVENT_TYPES } from "./events.js"

/**
 * Singleton Game State Manager
 * Ensures only one instance of the game state exists
 */
class GameStateManager {
	/** @type {GameStateManager|null} */
	static instance = null

	/**
	 * @param {Partial<GameState>} [initialState] - Optional initial state
	 */
	constructor(initialState = {}) {
		// If instance already exists, return it
		if (GameStateManager.instance) {
			return GameStateManager.instance
		}

		// Initialize state with defaults
		/** @type {GameState} */
		this.state = {
			round: initialState.round ?? 1,
			points: 0,
			teams: initialState.teams ?? [
				{ name: "Team A", score: 0 },
				{ name: "Team B", score: 0 },
			],
			activeTeamIndex: initialState.activeTeamIndex ?? 0,
			strikes: initialState.strikes ?? 0,
			answers: initialState.answers ?? [],
			revealedAnswers: initialState.revealedAnswers ?? new Set(),
		}

		// Store the instance
		GameStateManager.instance = this

		// Optionally seal the instance to prevent modifications
		Object.seal(this)
	}

	/**
	 * Get a copy of the current state
	 * @returns {GameState}
	 */
	get() {
		const {
			round,
			points,
			teams,
			activeTeamIndex,
			strikes,
			answers,
			revealedAnswers,
		} = this.state

		return {
			round,
			points,
			// TODO do i need to map or spread? Is copying important?
			teams: teams.map((team) => ({ ...team })),
			activeTeamIndex,
			strikes,
			answers: [...answers],
			revealedAnswers: new Set(revealedAnswers),
		}
	}

	/**
	 * Update state and dispatch event
	 * @param {Partial<GameState>} updates
	 * @param {string} [eventType]
	 */
	set(updates, eventType = EVENT_TYPES.STATE_CHANGED) {
		const previousState = this.get()

		// Handle Set and Array updates specially
		// if (updates.revealedAnswers !== undefined) {
		// 	this.state.revealedAnswers = new Set(updates.revealedAnswers)
		// }
		// if (updates.teams !== undefined) {
		// 	this.state.teams = updates.teams.map((team) => ({ ...team }))
		// }
		// if (updates.answers !== undefined) {
		// 	this.state.answers = [...updates.answers]
		// }

		// Update primitive values
		// if (updates.round !== undefined) {
		// 	this.state.round = updates.round
		// }
		// if (updates.activeTeamIndex !== undefined) {
		// 	this.state.activeTeamIndex = updates.activeTeamIndex
		// }
		// if (updates.strikes !== undefined) {
		// 	console.log(updates.strikes)
		// 	this.state.strikes = updates.strikes
		// }

		// TODO a catch all. Don't have to explicited state each object key
		//! this falls apart
		for (const [updateKey, updateValue] of Object.entries(updates)) {
			if (updateValue !== undefined) {
				//@ts-ignore
				this.state[updateKey] = updateValue
				// console.log(
				// 	"GameState this.state: ",
				// 	JSON.stringify(this.state, null, 2)
				// )
			} else {
				console.error(`[${updateKey}] does not exist on GameState`)
			}
		}

		// if it's a generic this.set() trigger
		if ((eventType = EVENT_TYPES.STATE_CHANGED)) {
			events.dispatchEvent(
				new CustomEvent(eventType, {
					detail: {
						state: this.get(),
						previousState,
						updates,
					},
				})
			)
		}
	}

	/**
	 * @param {number} teamIndex
	 * @param {string} newName
	 */
	setTeamName(teamIndex, newName) {
		if (!this.state.teams[teamIndex]) {
			console.error(`Team at index ${teamIndex} does not exist`)
			return
		}

		const oldName = this.state.teams[teamIndex].name
		const teams = [...this.state.teams]
		teams[teamIndex] = { ...teams[teamIndex], name: newName }

		this.set({ teams }, EVENT_TYPES.TEAM_RENAME)

		// Dispatch additional event with details
		events.dispatchEvent(
			new CustomEvent(EVENT_TYPES.TEAM_RENAME, {
				detail: { teamIndex, oldName, newName },
			})
		)
	}

	/**
	 *  @param {string} id
	 *  @param {boolean} isGuessed
	 */
	setIsGuessed(id, isGuessed) {
    // TODO i did use to return this.state.points and increment, but this is fool proof for all answers
		const prevPoints = this.state.points
		// const newPoints = this.state.answers.find((a) => a.id === id)?.points
		// if (!newPoints) throw new Error("no newPoints")
		const updatedAnswer = this.state.answers.find((a) => a.id === id)
		if (!updatedAnswer) throw new Error("no updatedAnswer")
		// updatedAnswer.isGuessed = isGuessed
		const updatedAnswers = this.state.answers.map((answer) => {
			return answer.id === id ? { ...answer, isGuessed } : answer
		})
		this.state.answers = updatedAnswers

		const totalPoints = this.state.answers.reduce((accumulator, answer) => {
			if (answer.isGuessed === true) {
				return accumulator + answer.points
			}
			return accumulator
		}, 0)

		// TODO. prob should just loop through all this.state.answers and add all points
		// const currentPoints = isGuessed
		// 	? prevPoints + newPoints
		// 	: prevPoints + newPoints * -1

		this.state.points = totalPoints

		events.dispatchEvent(
			new CustomEvent(EVENT_TYPES.UPDATE_POINTS, {
				detail: { prevPoints, currentPoints: totalPoints },
			})
		)
	}

	/** @param {number} num */
	setStrikes(num) {
		const strikes = Math.min(num, 3)

		// this.set({ strikes }, EVENT_TYPES.STRIKES_SET)
		this.state.strikes = strikes

		if (strikes === 3) {
			this.nextActiveTeam()
		}

		events.dispatchEvent(
			new CustomEvent(EVENT_TYPES.STRIKES_SET, {
				detail: { strikes },
			})
		)
	}

	nextActiveTeam() {
		const { activeTeamIndex: prevIndex, teams } = this.state

		const nextIndex = (prevIndex + 1) % teams.length

		this.state.activeTeamIndex = nextIndex
		// this.set(
		// 	{
		// 		activeTeamIndex: nextIndex,
		// 		strikes: 0,
		// 	},
		// 	EVENT_TYPES.TEAM_ACTIVE
		// )

		events.dispatchEvent(
			new CustomEvent(EVENT_TYPES.TEAM_ACTIVE, {
				detail: { nextTeamIndex: nextIndex, prevTeamIndex: prevIndex },
			})
		)
	}

	/**
	 * Reset state to initial values
	 */
	reset() {
		this.set(
			{
				round: 1,
				teams: [
					{ name: "Team A", score: 0 },
					{ name: "Team B", score: 0 },
				],
				activeTeamIndex: 0,
				strikes: 0,
				answers: [],
				revealedAnswers: new Set(),
			},
			EVENT_TYPES.STATE_CHANGED
		)
	}

	/**
	 * Static method to get the instance
	 * @param {Partial<GameState>} [initialState]
	 * @returns {GameStateManager}
	 */
	static getInstance(initialState = {}) {
		if (!GameStateManager.instance) {
			GameStateManager.instance = new GameStateManager(initialState)
		}
		return GameStateManager.instance
	}

	/**
	 * Static method to destroy the instance (useful for testing)
	 */
	static destroyInstance() {
		GameStateManager.instance = null
	}
}

// Export a single instance (no arguments needed since constructor has default)
export const gameStateManager = new GameStateManager()

// Also export the class for getInstance pattern
export { GameStateManager }
