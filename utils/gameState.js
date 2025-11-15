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
	roundType: "face-off",
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
		const localStorageState = this.getStoredData()
		const stateToUse = localStorageState || initialState
		// Initialize state with defaults
		/** @type {GameState} */
		this.state = {
			round: stateToUse.round ?? initGameState.round,
			points: 0,
			pointMultiplier: 1,
			roundType: stateToUse.roundType ?? initGameState.roundType,
			roundSteal: false,
			teams: stateToUse.teams ?? initGameState.teams,
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
	 * @returns {Partial<GameState>|null}
	 */
	getStoredData() {
		try {
			const saved = sessionStorage.getItem(this.storageKey)
			if (!saved) return null
			return JSON.parse(saved)
		} catch (error) {
			console.error("Error loading game state:", error)
			return null
		}
	}

	/**
	 * Load new question and answers into the game state
	 * @param {Question} question
	 * @param {GameAnswer[]} answers
	 */
	load(question, answers) {
		// Reset round values but keep teams
		this.state.points = 0
		//? must carry over activeTeamIndex from `face-off` to main `feud` round
		// TODO this could cause problems for games that are restarting a round?
		if (this.state.roundType === "face-off")
			this.state.activeTeamIndex = undefined
		this.state.strikes = 0
		this.state.roundSteal = false
		this.state.question = question
		this.state.answers = answers

		console.log("gamestate.load()")
		console.log(this.state)
		// Save to sessionStorage
		this.save()
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

	// TODO change this to `onTeamUpdate` to catch name and score changes
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
		const updatedAnswer = this.state.answers.find((a) => a.id === id)
		if (!updatedAnswer) throw new Error("no updatedAnswer")

		const updatedAnswers = this.state.answers.map((answer) => {
			return answer.id === id ? { ...answer, isGuessed } : answer
		})
		this.state.answers = updatedAnswers

		const prevPoints = this.state.points
		this.state.points = this.totalPoints

		this.save()

		events.dispatchEvent(
			new CustomEvent(EVENT_TYPES.UPDATE_POINTS, {
				detail: { prevPoints, currentPoints: this.state.points },
			})
		)
	}

	get totalPoints() {
		if (this.state.roundType === "face-off") return 0

		return this.state.answers.reduce((acc, answer) => {
			return answer.isGuessed ? acc + answer.points : acc
		}, 0)
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

	/** @param {number} [roundOverride]  */
	setNextRound(roundOverride) {
		const { round } = this.state
		const currRound = roundOverride ? roundOverride : round + 1
		switch (currRound) {
			case 1:
			case 3:
			case 5:
				this.state.roundType = "face-off"
				break
			// TODO is there a cleaner way for cases 2-5?
			case 2:
			case 4:
			case 6:
				this.state.roundType = "feud"
				break
			case 7:
				this.state.roundType = "fast-money"
				break

			default:
				break
		}

		this.state.round = currRound

		this.save()
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
		const {
			roundType,
			roundSteal,
			activeTeamIndex,
			points,
			pointMultiplier,
			teams,
		} = this.state

		//? do not award points if `face-off` round
		if (roundType !== "face-off") {
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
		}

		this.state.points = 0

		// TODO endRound func? need to check if last round and winner
		console.log("check round number. set type")

		this.save()

		events.dispatchEvent(
			new CustomEvent(EVENT_TYPES.AWARD_POINTS, {
				detail: { state: this.get() },
			})
		)
	}

	// TODO i can do this all with .load()
	// /** @param {GameAnswer[]} answers  */
	// nextRound(answers) {
	// 	console.log("gameState.nextRound()")
	// 	const currState = this.get()

	// 	this.save()

	// 	events.dispatchEvent(
	// 		new CustomEvent(EVENT_TYPES.NEXT_ROUND, {
	// 			detail: {
	// 				state: {
	// 					...currState,
	// 					round: currState.round + 1,
	// 					points: 0,
	// 					strikes: 0,
	// 					answers,
	// 				},
	// 			},
	// 		})
	// 	)
	// }

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
