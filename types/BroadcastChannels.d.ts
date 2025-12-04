import { GameState, Team, GameAnswer } from "./GameState"

export type BC_TYPE =
	| "game:teamUpdate"
	| "game:updatePoints"
	| "game:setStrikes"
	| "game:teamActive"

export type BC_TEAM_UPDATE = {
	type: "game:teamUpdate"
	detail: {
		index: number
		teamUpdate: Partial<Team>
	}
}

export type BC_UPDATE_POINTS = {
	type: "game:updatePoints"
	detail: {
		prevPoints: number
		currentPoints: number
		roundPhase: GameState["roundPhase"]
		updatedAnswer: GameAnswer
	}
}

export type BC_SET_STRIKES = {
	type: "game:setStrikes"
	detail: {
		strikes: number
		roundSteal: boolean
	}
}
export type BC_TEAM_ACTIVE = {
	type: "game:teamActive"
	detail: {
		nextTeamIndex: number
		prevTeamIndex: number
		isBuzzersActive: boolean
	}
}
