type BaseAnswer = {
	text: string
	questionId: string
	// TODO will it be better future proof to do nested ids?
	// upvotes: { userId: string }[]
	// downvotes: { userId: string }[]
	upvotes: string[]
	downvotes: string[]
	dateCreated: string
	authorId: string
	// Add more shared fields here as needed
}

type DatabaseFields = {
	typeof: "Answer"
	_id: string
	_rev: string
}

export type AnswerFormData = {
	_id: string
	upvote: boolean
	downvote: boolean
}

export type AnswerFormValues = {
	voterId: string
	questionId: string
	questionRev: string
	[key]: "upvote" | "downvote"
}

export type Answer = BaseAnswer & DatabaseFields

export type AnswerCreateRaw = {
	questionId: string
	text: string
}
export type AnswerCreateTrans = BaseAnswer & {
	// check if question.answers have same userId
	answers?: Answer[]
}

export type AnswerSet = CustomEvent<Answer>
export type AnswerDelete = CustomEvent<string>

export type AnswersChangeEvent = CustomEvent<Map<string, Answer>>
