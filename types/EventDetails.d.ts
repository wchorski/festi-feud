import { GameState } from "./GameState"

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
}
export type SetPointsDetail = {
	prevPoints: number
	currentPoints: number
}
export type RoundEndedDetail = {
	state: GameState
}
