import { GameState, Team } from "./GameState"

export type TeamRenamedDetail = {
	teamIndex: number
	oldName: string
	newName: string
}
export interface TeamRenameEvent extends CustomEvent<TeamRenameDetail> {
	type: "game:teamRename"
}

export type StrikesSetDetail = {
	strikes: number
	roundSteal: boolean
}
export interface StrikesSetEvent extends CustomEvent<StrikesSetDetail> {
	type: "game:setStrikes"
}

export type ActiveTeamDetail = {
	nextTeamIndex: number
	prevTeamIndex: number
	isBuzzersActive: boolean
}
export type SetPointsDetail = {
	prevPoints: number
	currentPoints: number
	roundPhase: GameState["roundPhase"]
	updatedAnswer: GameAnswer
}
export type RoundEndedDetail = {
	state: GameState
}
export type RoundPhaseDetail = {
	roundPhase: GameState["roundPhase"]
}

export type BuzzerDetail = {
	disabled: boolean
	activeTeamIndex: number
}
export type GameWinnerDetail = {
	state: GameState
	highestScoringTeam: Team
}
