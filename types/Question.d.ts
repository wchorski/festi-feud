type BaseQuestion = {
	text: string
	authorId: string
	categoryIds: string[]
	tagIds: string[]
	voterIds: string[]
	dateCreated: string
	// Add more shared fields here as needed
}

type DatabaseFields = {
  typeof: "Question"
	_id: string
	_rev: string
}

export type Question = BaseQuestion & DatabaseFields

export type QuestionCreateTrans = BaseQuestion & {
	_id?: string
}
export type QuestionCreateRaw = BaseQuestion & {
	_id?: string
}

export type QuestionSet = CustomEvent<Question>
export type QuestionDelete = CustomEvent<string>

export type QuestionsChangeEvent = CustomEvent<Map<string, Question>>
