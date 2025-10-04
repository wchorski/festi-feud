/**
 * @typedef {import("./types/Vote").VoteSubmission} VoteSubmission
 * @typedef {import("./types/Vote").VoteFlag} VoteFlags
 * @typedef {Object.<string, any>} FormData
 * Raw form data as key-value pairs
 */

/**
 * @typedef {function(FormData): FormData} TransformFunction
 * A function that takes form data and returns transformed form data
 */

export const transforms = {
	/**
	 * Merge additional metadata or context data with form data
	 * @param {Object} metadata - Object containing metadata to merge
	 * @returns {TransformFunction} Transform function that adds metadata
	 * @example
	 * const pageData = { userId: "123", sessionId: "abc" }
	 * const transform = transforms.metadata(pageData)
	 * const result = transform({ text: "My answer" })
	 * // { text: "My answer", userId: "123", sessionId: "abc" }
	 *
	 * @example
	 * // Nested metadata
	 * const transform = transforms.metadata({
	 *   user: { id: "123", role: "member" },
	 *   session: { id: "abc", started: "2025-10-02" }
	 * })
	 */
	metadata: (metadata) => (raw) => ({
		...raw,
		...metadata,
	}),

	//? i don't want to make all transforms async because only this func is
	// /**
	//  * @param {string} myKey
	//  * @returns {TransformFunction}
	//  */
	// getUUID: (myKey) => async (raw) => {
	// 	const uuid = await getUserUUID()
	// 	return {
	// 		[myKey]: uuid,
	// 		...raw,
	// 	}
	// },

	/**
	 * Extract answers from form data using pattern matching
	 * @param {RegExp} pattern - Regular expression to match answer keys and extract IDs
	 * @returns {TransformFunction} Transform function that extracts answers
	 * @example
	 * const transform = transforms.extractAnswers(/^answers\['(.+)'\]$/)
	 * const result = transform({ "answers['123']": "upvote" })
	 * // { "answers['123']": "upvote", answers: [{ id: "123", value: "upvote" }] }
	 */
	extractVotes: (pattern) => (raw) => {
		const votes = []
		for (const [key, value] of Object.entries(raw)) {
			const match = key.match(pattern)
			if (match) {
				votes.push({
					_id: match[1],
					value: value,
				})
			}
		}
		return { ...raw, votes }
	},

	/**
	 * Convert answer values to boolean flags (upvote, downvote, novote)
	 * @type {TransformFunction}
	 * @param {FormData & { votes?: VoteSubmission[] }} raw - Form data with answers array
	 * @returns {FormData & { votes?: VoteFlags[] }} Form data with boolean flags
	 * @example
	 * const input = { answers: [{ id: "123", value: "upvote" }] }
	 * const result = transforms.answersToFlags(input)
	 * // { votes: [{ _id: "123", upvote: true, downvote: false }] }
	 */
	votesToFlags: (raw) => {
		//@ts-ignore
		if (!raw.votes) return raw
		return {
			...raw,
			votes: raw.votes.map((v) => ({
				...v,
				upvote: v.value === "upvote",
				downvote: v.value === "downvote",
			})),
		}
	},

	/**
	 * Pick only specific fields from form data
	 * @param {...string} fields - Field names to keep
	 * @returns {TransformFunction} Transform function that picks specified fields
	 * @example
	 * const transform = transforms.pick('voterId', 'questionId')
	 * const result = transform({ voterId: "123", questionId: "456", extra: "removed" })
	 * // { voterId: "123", questionId: "456" }
	 */
	pick:
		(...fields) =>
		(raw) => {
			const result = {}
			fields.forEach((field) => {
				//@ts-ignore
				if (field in raw) result[field] = raw[field]
			})
			return result
		},

	/**
	 * Combine separate ID and revision fields into a nested object
	 * Useful for CouchDB-style documents that need _id and _rev
	 * @param {Object} config - Configuration for the transform
	 * @param {string} config.idField - Name of the ID field (e.g., 'questionId')
	 * @param {string} config.revField - Name of the revision field (e.g., 'questionRev')
	 * @param {string} config.targetField - Name of the target nested object (e.g., 'question')
	 * @param {boolean} [config.removeSource=true] - Whether to remove source fields after combining
	 * @returns {TransformFunction} Transform function that combines fields into nested object
	 * @example
	 * const transform = transforms.combineIdRev({
	 *   idField: 'questionId',
	 *   revField: 'questionRev',
	 *   targetField: 'question'
	 * })
	 * const result = transform({ questionId: "123", questionRev: "2-abc" })
	 * // { question: { _id: "123", _rev: "2-abc" } }
	 */
	combineIdRev: (config) => (raw) => {
		const { idField, revField, targetField, removeSource = true } = config

		const result = { ...raw }

		// Create nested object with _id and _rev
		if (idField in raw || revField in raw) {
			result[targetField] = {}

			if (idField in raw) {
				result[targetField]._id = raw[idField]
				if (removeSource) delete result[idField]
			}

			if (revField in raw) {
				result[targetField]._rev = raw[revField]
				if (removeSource) delete result[revField]
			}
		}

		return result
	},

	/**
	 * Add ISO timestamp to form data
	 * @type {TransformFunction}
	 * @param {FormData} raw - Form data to add timestamp to
	 * @returns {FormData & { dateCreated: string }} Form data with submittedAt timestamp
	 * @example
	 * const result = transforms.addTimestamp({ voterId: "123" })
	 * // { voterId: "123", submittedAt: "2025-10-02T12:34:56.789Z" }
	 */
	addTimestamp: (raw) => ({
		...raw,
		dateCreated: new Date().toISOString(),
	}),

	/**
	 * Trim all string values in form data
	 * @type {TransformFunction}
	 * @param {FormData} raw - Form data with potentially untrimmed strings
	 * @returns {FormData} Form data with trimmed string values
	 * @example
	 * const result = transforms.trimStrings({ name: "  John  ", age: 25 })
	 * // { name: "John", age: 25 }
	 */
	trimStrings: (raw) => {
		const result = {}
		for (const [key, value] of Object.entries(raw)) {
			//@ts-ignore
			result[key] = typeof value === "string" ? value.trim() : value
		}
		return result
	},

	/**
	 * Remove fields with empty string, null, or undefined values
	 * @type {TransformFunction}
	 * @param {FormData} raw - Form data to clean
	 * @returns {FormData} Form data with empty values removed
	 * @example
	 * const result = transforms.removeEmpty({ name: "John", email: "", age: null })
	 * // { name: "John" }
	 */
	removeEmpty: (raw) => {
		const result = {}
		for (const [key, value] of Object.entries(raw)) {
			if (value !== "" && value !== null && value !== undefined) {
				//@ts-ignore
				result[key] = value
			}
		}
		return result
	},

	/**
	 * Convert string values to lowercase
	 * @param {...string} fields - Field names to convert to lowercase
	 * @returns {TransformFunction} Transform function that lowercases specified fields
	 * @example
	 * const transform = transforms.lowercase('email', 'username')
	 * const result = transform({ email: "JOHN@EXAMPLE.COM", name: "John" })
	 * // { email: "john@example.com", name: "John" }
	 */
	lowercase:
		(...fields) =>
		(raw) => {
			const result = { ...raw }
			fields.forEach((field) => {
				if (field in result && typeof result[field] === "string") {
					result[field] = result[field].toLowerCase()
				}
			})
			return result
		},

	/**
	 * Rename fields in form data
	 * @param {Object.<string, string>} mapping - Object mapping old field names to new field names
	 * @returns {TransformFunction} Transform function that renames fields
	 * @example
	 * const transform = transforms.rename({ voter_id: 'voterId', question_id: 'questionId' })
	 * const result = transform({ voter_id: "123", question_id: "456" })
	 * // { voterId: "123", questionId: "456" }
	 */
	rename: (mapping) => (raw) => {
		const result = {}
		for (const [key, value] of Object.entries(raw)) {
			const newKey = mapping[key] || key
			//@ts-ignore
			result[newKey] = value
		}
		return result
	},

	/**
	 * Parse numeric strings to numbers
	 * @param {...string} fields - Field names to parse as numbers
	 * @returns {TransformFunction} Transform function that parses specified fields to numbers
	 * @example
	 * const transform = transforms.parseNumbers('age', 'score')
	 * const result = transform({ age: "25", score: "100", name: "John" })
	 * // { age: 25, score: 100, name: "John" }
	 */
	parseNumbers:
		(...fields) =>
		(raw) => {
			const result = { ...raw }
			fields.forEach((field) => {
				if (field in result && typeof result[field] === "string") {
					const parsed = Number(result[field])
					if (!isNaN(parsed)) {
						result[field] = parsed
					}
				}
			})
			return result
		},

	/**
	 * Parse boolean strings to booleans
	 * @param {...string} fields - Field names to parse as booleans
	 * @returns {TransformFunction} Transform function that parses specified fields to booleans
	 * @example
	 * const transform = transforms.parseBooleans('isActive', 'verified')
	 * const result = transform({ isActive: "true", verified: "false", name: "John" })
	 * // { isActive: true, verified: false, name: "John" }
	 */
	parseBooleans:
		(...fields) =>
		(raw) => {
			const result = { ...raw }
			fields.forEach((field) => {
				if (field in result) {
					const value = result[field]
					if (value === "true" || value === true) result[field] = true
					else if (value === "false" || value === false) result[field] = false
				}
			})
			return result
		},
}

/**
 * Compose multiple transform functions into a single transform function
 * Executes transforms from left to right (first to last)
 * @param {...TransformFunction} transforms - Transform functions to compose
 * @returns {TransformFunction} Composed transform function
 * @example
 * const transform = compose(
 *   transforms.trimStrings,
 *   transforms.lowercase('email'),
 *   transforms.parseNumbers('age')
 * )
 * const result = transform({ email: " JOHN@EXAMPLE.COM ", age: "25" })
 * // { email: "john@example.com", age: 25 }
 */
export function compose(...transforms) {
	return (data) => transforms.reduce((acc, fn) => fn(acc), data)
}

/**
 * Pipe multiple transform functions (alias for compose with clearer intent)
 * Executes transforms from left to right (first to last)
 * @param {...TransformFunction} transforms - Transform functions to pipe
 * @returns {TransformFunction} Piped transform function
 * @example
 * const transform = pipe(
 *   transforms.trimStrings,
 *   transforms.removeEmpty,
 *   transforms.addTimestamp
 * )
 */
export function pipe(...transforms) {
	return compose(...transforms)
}
