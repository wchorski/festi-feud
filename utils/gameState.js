/**
 * @typedef {import('types/GameState.js').GameState} GameState
 * @typedef {import('types/GameState.js').Team} Team
 * @typedef {import('types/GameState.js').GameAnswer} GameAnswer
 * @typedef {import("types/Question.js").Question} Question
 * @typedef {import('types/EventDetails.js').TeamRenamedDetail} TeamRenamedDetail
 */
import { events, EVENT_TYPES } from "./events.js"

/** @type {GameState} */
const initGameState = {
	round: 1,
	points: 0,
	pointMultiplier: 1,
	roundType: "feud",
	roundSteal: false,
	teams: [
		{ name: "Team A", score: 0 },
		{ name: "Team B", score: 0 },
	],
	activeTeamIndex: undefined,
	strikes: 0,
	question: undefined,
	answers: [],
}

// TODO save gamestate to local storage as to persist if browser is refreshed
/**
 * Singleton Game State Manager
 * Ensures only one instance of the game state exists
 */
class GameStateManager {
	/** @type {GameStateManager|null} */
	static instance = null
	/** @type {string} */
	storageKey = "gameState"

	/**
	 * @param {Partial<GameState>} [initialState] - Optional initial state
	 * @param {string} [storageKey]
	 */
	constructor(initialState = initGameState, storageKey = "gameState") {
		// If instance already exists, return it (Singleton Pattern)
		if (GameStateManager.instance) return GameStateManager.instance
		this.storageKey = storageKey
		const savedState = this.load()
		const stateToUse = savedState || initialState
		// Initialize state with defaults
		/** @type {GameState} */
		this.state = {
			round: stateToUse.round ?? 1,
			points: 0,
			pointMultiplier: 1,
			roundType: "feud",
			roundSteal: false,
			teams: stateToUse.teams ?? [
				{ name: "Team A", score: 0 },
				{ name: "Team B", score: 0 },
			],
			activeTeamIndex: stateToUse.activeTeamIndex,
			strikes: stateToUse.strikes ?? 0,
			question: undefined,
			answers: stateToUse.answers ?? [],
		}

		// Store the instance
		GameStateManager.instance = this
		this.save()
		// Optionally seal the instance to prevent modifications
		Object.seal(this)
	}

	/**
	 * Load state from sessionStorage
	 * @param {Question} [question]
	 * @param {GameAnswer[]} [answers]
	 * @returns {Partial<GameState>|null}
	 */
	load(question, answers) {
		try {
			const saved = sessionStorage.getItem(this.storageKey)
			//? return initGameState
			if (!saved) return null

			/** @type {GameState} */
			const parsed = JSON.parse(saved)

			// TODO make a shallow `newRoundReset` keeping teams but reseting round values
			if (question && answers) {
				parsed.points = 0
				parsed.activeTeamIndex = undefined
				parsed.strikes = 0
				parsed.roundSteal = false
				parsed.question = question
				parsed.answers = answers
			}

			return parsed
		} catch (error) {
			console.error("Error loading game state:", error)
			return null
		}
	}

	// TODO i'll need to this.save() on any function that manipulates this.state. or should i funnel all funcs to this.set()?
	/**
	 * Save state to sessionStorage
	 */
	save() {
		try {
			// Convert Set to Array for JSON serialization
			const stateToSave = this.state

			sessionStorage.setItem(this.storageKey, JSON.stringify(stateToSave))
		} catch (error) {
			console.error("Error saving game state:", error)
		}
	}

	/**
	 * Get a copy of the current state
	 * @returns {GameState}
	 */
	get() {
		const {
			round,
			points,
			pointMultiplier,
			roundType,
			roundSteal,
			teams,
			activeTeamIndex,
			strikes,
			answers,
			question,
		} = this.state

		return {
			round,
			points,
			pointMultiplier,
			roundType,
			roundSteal,
			// TODO do i need to map or spread? Is copying important?
			teams: teams.map((team) => ({ ...team })),
			activeTeamIndex,
			strikes,
			question,
			answers: [...answers],
		}
	}

	/**
	 * Update state and dispatch event
	 * @param {Partial<GameState>} updates
	 * @param {string} [eventType]
	 */
	set(updates, eventType = EVENT_TYPES.STATE_CHANGED) {
		const previousState = this.get()

		// TODO a catch all. Don't have to explicited state each object key
		//! this falls apart
		for (const [updateKey, updateValue] of Object.entries(updates)) {
			if (updateValue !== undefined) {
				//@ts-ignore
				this.state[updateKey] = updateValue
				// console.log(
				// 	"GameState this.state: ",
				// 	this.state
				// 	// JSON.stringify(this.state, null, 2)
				// )
			} else {
				console.error(`[${updateKey}] does not exist on GameState`)
			}
		}

		this.save()

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

		this.save()

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

		this.save()

		events.dispatchEvent(
			new CustomEvent(EVENT_TYPES.UPDATE_POINTS, {
				detail: { prevPoints, currentPoints: totalPoints },
			})
		)
	}

	/** @param {number} num */
	setStrikes(num) {
		if (this.state.activeTeamIndex === undefined)
			throw new Error("set active team")

		const strikes = Math.min(num, 3)

		// this.set({ strikes }, EVENT_TYPES.STRIKES_SET)
		this.state.strikes = strikes

		if (strikes === 3) {
			// TODO instead of setting active team use `roundSteal = true`
			// this.nextActiveTeam()
			this.state.roundSteal = true
		}

		this.save()

		events.dispatchEvent(
			new CustomEvent(EVENT_TYPES.SET_STRIKES, {
				detail: { strikes, roundSteal: this.state.roundSteal },
			})
		)
	}

	/** @param {boolean} roundSteal  */
	setRoundSteal(roundSteal) {
		this.state.roundSteal = roundSteal

		this.save()

		events.dispatchEvent(
			new CustomEvent(EVENT_TYPES.ROUNDSTEAL_SET, {
				detail: { roundSteal: this.state.roundSteal },
			})
		)
	}

	/**. @param {number|undefined} teamIndex  */
	setActiveTeam(teamIndex) {
		const { activeTeamIndex: prevIndex } = this.state

		this.state.activeTeamIndex = teamIndex

		this.save()

		events.dispatchEvent(
			new CustomEvent(EVENT_TYPES.TEAM_ACTIVE, {
				detail: { nextTeamIndex: teamIndex, prevTeamIndex: prevIndex },
			})
		)
	}

	nextActiveTeam() {
		// TODO instead of setting active team use `roundSteal`
		const { activeTeamIndex: prevIndex, teams } = this.state
		if (prevIndex === undefined)
			throw new Error("active team not set. Manually choose active team")

		const nextIndex = (prevIndex + 1) % teams.length

		this.state.activeTeamIndex = nextIndex

		this.save()

		events.dispatchEvent(
			new CustomEvent(EVENT_TYPES.TEAM_ACTIVE, {
				detail: { nextTeamIndex: nextIndex, prevTeamIndex: prevIndex },
			})
		)
	}

	awardPoints() {
		const { roundSteal, activeTeamIndex, points, pointMultiplier, teams } =
			this.state
		if (activeTeamIndex === undefined)
			throw new Error("activeTeamIndex is undefined")

		const totalPoints = points * pointMultiplier

		const teamStealIndex = (activeTeamIndex + 1) % teams.length

		const winningTeamIndex = roundSteal ? teamStealIndex : activeTeamIndex

		this.state.teams = this.state.teams.map((team, index) =>
			index === winningTeamIndex
				? { ...team, score: team.score + totalPoints }
				: team
		)

		this.state.points = 0

		this.save()

		events.dispatchEvent(
			new CustomEvent(EVENT_TYPES.AWARD_POINTS, {
				detail: { state: this.get() },
			})
		)
	}

	/** @param {GameAnswer[]} answers  */
	nextRound(answers) {
		console.log("gameState.nextRound()")
		const currState = this.get()

		this.save()

		events.dispatchEvent(
			new CustomEvent(EVENT_TYPES.NEXT_ROUND, {
				detail: {
					state: {
						...currState,
						round: currState.round + 1,
						points: 0,
						strikes: 0,
						answers,
					},
				},
			})
		)
	}

	/**
	 * Reset state to initial values
	 */
	reset() {
		this.set(initGameState, EVENT_TYPES.STATE_CHANGED)
		sessionStorage.removeItem(this.storageKey)
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
