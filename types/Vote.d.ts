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
	_id: string
	value: "upvote" | "downvote"
}
export type VoteFlag = {
	_id: string
	upvote: boolean
	downvote: boolean
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

export type Ballot = {
  _id: string
	typeof: "Ballot"
	voterId: string
	questionId: string
	// answerIds
	upvotes: string[]
	downvotes: string[]
}
