type BaseAnswer = {
	text: string
	questionId: string
	votes: number
	// Add more shared fields here as needed
}

type DatabaseFields = {
	_id: string
	_rev: string
}

export type Answer = BaseAnswer & DatabaseFields

export type AnswerCreate = BaseAnswer & {
	_id?: string
}

export type AnswerSet = CustomEvent<Answer>
export type AnswerDelete = CustomEvent<string>

export type AnswersChangeEvent = CustomEvent<Map<string, Answer>>
