export type Answer = {
	_id: string
	_rev: string
	username: string
	questionId: number
  votes: number
  text: string
	date: string
}

export type NewAnswer = {
	_id?: string
	username: string
	questionId: number
  votes: number
  text: string
	date: string
}

export type AnswerSet = CustomEvent<Answer>
