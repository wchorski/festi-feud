import { GameState, Team, GameAnswer } from "./GameState"

// TODO use this intead. should aut
export type BC_GAME_MESSAGE =
	| {
			type: "game:teamUpdate"
			detail: BC_TEAM_UPDATE_DETAIL
	  }
	| {
			type: "game:updatePoints"
			detail: BC_UPDATE_POINTS_DETAIL
	  }
	| {
			type: "game:setStrikes"
			detail: BC_SET_STRIKES_DETAIL
	  }
	| {
			type: "game:teamActive"
			detail: BC_TEAM_ACTIVE_DETAIL
	  }
	| {
			type: "game:endRound"
			detail: BC_END_ROUND_DETAIL
	  }
	| {
			type: "game:end"
			detail: BC_END_GAME_DETAIL
	  }
	| {
			type: "game:load"
			detail: BC_GAME_LOAD_DETAIL
	  }
	| {
			type: "game:buzzIn"
			detail: BC_GAME_BUZZ_IN_DETAIL
	  }

//? keeping this around if BC_GAME_MESSAGE type doesn't work out
// export type BC_TYPE =
// 	| "game:teamUpdate"
// 	| "game:updatePoints"
// 	| "game:setStrikes"
// 	| "game:teamActive"
// 	| "game:endRound"
// 	| "game:end"
// 	| "game:load"

export type BC_TEAM_UPDATE_DETAIL = {
	index: number
	teamUpdate: Partial<Team>
}

export type BC_UPDATE_POINTS_DETAIL = {
	prevPoints: number
	currentPoints: number
	roundPhase: GameState["roundPhase"]
	updatedAnswer: Partial<GameAnswer>
}

export type BC_SET_STRIKES_DETAIL = {
	strikes: number
	roundSteal: boolean
}
export type BC_TEAM_ACTIVE_DETAIL = {
	nextTeamIndex: number | undefined
	prevTeamIndex: number | undefined
	isBuzzersActive: boolean
}
export type BC_END_ROUND_DETAIL = {
	state: GameState
}
export type BC_END_GAME_DETAIL = {
	state: GameState
	highestScoringTeam: Team
}
export type BC_GAME_LOAD_DETAIL = {
	state: GameState
}
export type BC_GAME_BUZZ_IN_DETAIL = {
	nextTeamIndex: GameState["activeTeamIndex"]
	prevTeamIndex: number | undefined
	isBuzzersActive: boolean
}
