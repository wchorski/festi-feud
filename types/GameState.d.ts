import { Question } from "./Question"

export type GameState = {
	round: number
	points: number
	pointMultiplier: number
	roundType: "face-off" | "feud" | "fast-money" | "conclusion"
	roundPhase: "ingame" | "end" | "conclusion"
	roundSteal: boolean
	teams: Team[]
	isBuzzersActive: boolean
	activeTeamIndex: number | undefined
	strikes: number
	question: Question | undefined
	// TODO consider converting Array to Set instead
	answers: GameAnswer[]
}

export type Team = {
	name: string
	score: number
}
export type GameAnswer = {
	id: string
	text: string
	authorId: string
	upvotes: number
	downvotes: number
	points: number
	isGuessed: boolean
	netScore: number
	popularity: number
	uniqueVoterNum: uniqueVoters.size
}
