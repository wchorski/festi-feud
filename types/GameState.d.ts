export type GameState = {
	round: number
	points: number
	teams: Team[]
	activeTeamIndex: number | undefined
	strikes: number
	answers: GameAnswer[]
	revealedAnswers: Set<number>
}

export type Team = {
	name: string
	score: number
}
export type GameAnswer = {
	id: string
	text: string
	points: number
	isGuessed: boolean
}
