export type VoteSubmitData = {
	voterId: string
	questionId: string
	// TODO not a clean way to do it but make sense to read. find a way to handle dynamically added fields
} & Record<string, "upvote" | "downvote">

export type VoteFormData = {
	voterId: string
	question: {
		_id: string
		_rev: string
	}
	Votes: {
		_id: string
		upvote: boolean
		downvote: boolean
	}[]
}

export type VoteSubmission = {
	//? Answer id
	_id: string
	value: "upvote" | "downvote"
}
export type VoteFlag = {
	_id: string
	upvote: boolean
	downvote: boolean
}
export type VoteArrays = {
	upvotes: string[]
	downvotes: string[]
}

type BaseVote = {
	voterId: string
	questionId: string
	answerId: string
	upvote: boolean
	downvote: boolean
}

type DatabaseFields = {
	typeof: "Vote"
	_id: string
	_rev: string
}

export type Vote = BaseVote & DatabaseFields

export type BaseBallot = {
	voterId: string
	questionId: string
	dateCreated: string
	// answerIds
	upvotes: string[]
	downvotes: string[]
}

type BallotDatabaseFields = {
	_id: string
	_rev: string
	typeof: "Ballot"
}

export type Ballot = BaseBallot & BallotDatabaseFields

export type BallotCreateRaw = {
	questionId: string
	text: string
}
export type AnswerCreateTrans = BaseAnswer & {
	// check if question.answers have same userId
	answers?: Answer[]
}
