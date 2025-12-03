/**
 * @typedef {import('types/GameState.js').GameState} GameState
 * @typedef {import('types/GameState.js').Team} Team
 * @typedef {import('types/GameState.js').GameAnswer} GameAnswer
 * @typedef {import("types/Question.js").Question} Question
 * @typedef {import("types/EventDetails").SetPointsDetail} SetPointsDetail
 * @typedef {import("types/BroadcastChannels").BC_UPDATE_POINTS} BC_UPDATE_POINTS
 * @typedef {import("types/BroadcastChannels").BC_TEAM_UPDATE} BC_TEAM_UPDATE
 * @typedef {import("types/BroadcastChannels").BC_SET_STRIKES} BC_SET_STRIKES
 */
import { events, EVENT_TYPES, gameChannel, CHANNEL_TYPES } from "./events.js"

/** @type {GameState} */
const initGameState = {
	round: 1,
	points: 0,
	pointMultiplier: 1,
	roundType: "face-off",
	roundPhase: "ingame",
	roundSteal: false,
	teams: [
		{ name: "Team A", score: 0 },
		{ name: "Team B", score: 0 },
	],
	isBuzzersActive: false,
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
			roundPhase: stateToUse.roundPhase ?? initGameState.roundPhase,
			roundSteal: false,
			teams: stateToUse.teams ?? initGameState.teams,
			isBuzzersActive:
				stateToUse.isBuzzersActive ?? initGameState.isBuzzersActive,
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
	 * Load state from localStorage
	 * @returns {Partial<GameState>|null}
	 */
	getStoredData() {
		try {
			const saved = localStorage.getItem(this.storageKey)
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
		if (this.state.roundType === "face-off") {
			this.state.activeTeamIndex = undefined
			this.state.isBuzzersActive = true
		}
		this.state.roundPhase = "ingame"
		this.state.strikes = 0
		this.state.roundSteal = false
		this.state.question = question
		this.state.answers = answers

		// Save to localStorage
		this.save()
	}

	// TODO i'll need to this.save() on any function that manipulates this.state. or should i funnel all funcs to this.set()?
	/**
	 * Save state to localStorage
	 */
	save() {
		try {
			// Convert Set to Array for JSON serialization
			const stateToSave = this.state

			localStorage.setItem(this.storageKey, JSON.stringify(stateToSave))
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
			roundPhase,
			roundSteal,
			teams,
			isBuzzersActive,
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
			roundPhase,
			roundSteal,
			// TODO do i need to map or spread? Is copying important?
			teams: teams.map((team) => ({ ...team })),
			isBuzzersActive,
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
		const previousState = this.state

		// TODO a catch all. Don't have to explicited state each object key
		//! this falls apart
		for (const [updateKey, updateValue] of Object.entries(updates)) {
			// TODO how to check if `updateValue` is an *included* key string in the GameState object?
			// if (updateValue !== undefined) {
			//@ts-ignore
			this.state[updateKey] = updateValue
			// console.log(
			// 	"GameState this.state: ",
			// 	this.state
			// 	// JSON.stringify(this.state, null, 2)
			// )
			// }
			// TODO does not account for `activeTeamIndex` and `question` which can be set as undefined
			// else {
			// 	console.error(`[${updateKey}] cannot be set as undefined on GameState`)
			// }
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

	/** @param {GameState['roundPhase']} roundPhase   */
	setRoundPhase(roundPhase) {
		this.state.roundPhase = roundPhase
		this.save()
		events.dispatchEvent(
			new CustomEvent(EVENT_TYPES.SET_ROUNDPHASE, {
				detail: { roundPhase },
			})
		)
	}

	endRound() {
		this.setRoundPhase("end")
		this.awardPoints()

		if (this.state.round === 6) this.endGame()

		// other funcs save the data
		this.save()

		events.dispatchEvent(
			new CustomEvent(EVENT_TYPES.END_ROUND, {
				detail: { state: this.state },
			})
		)
	}

	endGame() {
		const { teams } = this.state
		this.state.roundType = "conclusion"
		this.state.roundPhase = "conclusion"

		teams.sort((a, b) => b.score - a.score)

		this.save()

		events.dispatchEvent(
			new CustomEvent(EVENT_TYPES.GAME_WINNER, {
				detail: { state: this.state, highestScoringTeam: teams[0] },
			})
		)
	}

	// TODO remove this and replace with `updateTeam`
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
		const { points: prevPoints, answers, roundPhase } = this.state

		const updatedAnswer = answers.find((a) => a.id === id)
		if (!updatedAnswer) throw new Error("no updatedAnswer")

		const updatedAnswers = answers.map((answer) => {
			return answer.id === id ? { ...answer, isGuessed } : answer
		})
		this.state.answers = updatedAnswers

		this.state.points = this.totalPoints

		this.save()

		gameChannel.postMessage(
			/** @type {BC_UPDATE_POINTS} */ ({
				type: CHANNEL_TYPES.UPDATE_POINTS,
				detail: {
					prevPoints,
					currentPoints: this.state.points,
					roundPhase,
					updatedAnswer: { id, isGuessed },
				},
			})
		)
		// events.dispatchEvent(
		// 	/** @type {CustomEvent<SetPointsDetail>} */ (
		// 		new CustomEvent(EVENT_TYPES.UPDATE_POINTS, {
		// 			detail: {
		// 				prevPoints,
		// 				currentPoints: this.state.points,
		// 				roundPhase,
		// 				updatedAnswer: { id, isGuessed },
		// 			},
		// 		})
		// 	)
		// )
	}

	get totalPoints() {
		if (this.state.roundType === "face-off") return 0
		if (this.state.roundPhase === "end") return 0

		return this.state.answers.reduce((acc, answer) => {
			return answer.isGuessed ? acc + answer.points : acc
		}, 0)
	}

	/** @param {number} num */
	setStrikes(num) {
		const { activeTeamIndex, roundType, roundSteal } = this.state
		if (activeTeamIndex === undefined) throw new Error("set active team")
		if (roundType !== "feud")
			throw new Error(`cannot set strikes on roundType: ${roundType}`)

		const strikes = Math.min(num, 3)

		// this.set({ strikes }, EVENT_TYPES.STRIKES_SET)
		this.state.strikes = strikes

		strikes === 3
			? (this.state.roundSteal = true)
			: (this.state.roundSteal = false)

		this.save()

		gameChannel.postMessage(
			/** @type {BC_SET_STRIKES} */ ({
				type: CHANNEL_TYPES.SET_STRIKES,
				detail: { strikes, roundSteal: this.state.roundSteal },
			})
		)
		// events.dispatchEvent(
		// 	new CustomEvent(EVENT_TYPES.SET_STRIKES, {
		// 		detail: { strikes, roundSteal: this.state.roundSteal },
		// 	})
		// )
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
				this.state.isBuzzersActive = true
				break
			// TODO is there a cleaner way for cases 2-5?
			case 2:
			case 4:
			case 6:
				this.state.roundType = "feud"
				break
			case 7:
				this.state.roundType = "conclusion"
				break
			// case 7:
			// 	this.state.roundType = "fast-money"
			// 	break
			// case 8:
			// 	this.state.roundType = "fast-money"
			// 	break
			// case 9:
			// 	this.state.roundType = "conclusion"
			// 	break

			default:
				break
		}

		switch (currRound) {
			case 1:
				this.state.pointMultiplier = 0
				break
			case 2:
				this.state.pointMultiplier = 1
				break
			case 3:
				this.state.pointMultiplier = 0
				break
			case 4:
				this.state.pointMultiplier = 2
				break
			case 5:
				this.state.pointMultiplier = 0
				break
			case 6:
				this.state.pointMultiplier = 3
				break
			case 7:
				this.state.pointMultiplier = 0
				break
			// case 8:
			// 	this.state.pointMultiplier = 1
			// 	break
			// case 9:
			// 	this.state.pointMultiplier = 0
			// 	break

			default:
				break
		}

		this.state.round = currRound

		this.save()

		events.dispatchEvent(
			new CustomEvent(EVENT_TYPES.ROUNDSTEAL_SET, {
				detail: { roundSteal: this.state.roundSteal },
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
	buzzIn(teamIndex) {
		const { isBuzzersActive, activeTeamIndex } = this.state
		// TODO show toast notification
		if (activeTeamIndex !== undefined)
			return console.log(`activeTeamIndex is set to ${activeTeamIndex}`)
		if (!isBuzzersActive) return console.log("isBuzzersActive is false")
		const { activeTeamIndex: prevIndex } = this.state

		this.state.activeTeamIndex = teamIndex
		this.state.isBuzzersActive = false

		this.save()

		events.dispatchEvent(
			new CustomEvent(EVENT_TYPES.TEAM_ACTIVE, {
				detail: {
					nextTeamIndex: teamIndex,
					prevTeamIndex: prevIndex,
					isBuzzersActive: false,
				},
			})
		)
	}

	/**. @param {number|undefined} teamIndex  */
	setActiveTeam(teamIndex) {
		const { activeTeamIndex: prevIndex, isBuzzersActive } = this.state

		this.state.activeTeamIndex = teamIndex

		this.save()

		events.dispatchEvent(
			new CustomEvent(EVENT_TYPES.TEAM_ACTIVE, {
				detail: {
					nextTeamIndex: teamIndex,
					prevTeamIndex: prevIndex,
					isBuzzersActive,
				},
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

	/**
	 * @param {number} index - The index of the team to update.
	 * @param {Partial<Team>} teamUpdate
	 * */
	updateTeam(index, teamUpdate) {
		this.state.teams = this.state.teams.map((team, i) =>
			i === index ? { ...team, ...teamUpdate } : team
		)

		this.save()

		gameChannel.postMessage(
			/** @type {BC_TEAM_UPDATE} */ ({
				type: CHANNEL_TYPES.TEAM_UPDATE,
				detail: {
					index,
					teamUpdate,
				},
			})
		)

		// events.dispatchEvent(
		// 	new CustomEvent(EVENT_TYPES.TEAM_UPDATE, {
		// 		detail: { index, teamUpdate },
		// 	})
		// )
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
				detail: { state: this.state },
			})
		)
	}

	/** Reset state for a whole new game */
	reset() {
		localStorage.removeItem(this.storageKey)
		this.set(initGameState, EVENT_TYPES.STATE_CHANGED)
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
