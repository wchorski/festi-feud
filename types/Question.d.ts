type BaseQuestion = {
  typeof: "Question"
	text: string
  categoryIds: string[]
  tagIds: string[]
	// Add more shared fields here as needed
}

type DatabaseFields = {
	_id: string
	_rev: string
}

export type Question = BaseQuestion & DatabaseFields

export type QuestionCreate = BaseQuestion & {
	_id?: string
}

export type QuestionSet = CustomEvent<Question>
export type QuestionDelete = CustomEvent<string>

export type QuestionsChangeEvent = CustomEvent<Map<string, Question>>
