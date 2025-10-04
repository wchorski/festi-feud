/**
 * @typedef {import('types/Vote.js').VoteFormData} VoteFormData
 * @typedef {import('types/Vote.js').VoteSubmitData} VoteSubmitData
 * @typedef {import("./transforms.js").TransformFunction} TransformFunction
 */

import { compose, transforms } from "./transforms.js"
import { getUserUUID } from "./uuid.js"

/**
 * Creates a reusable form submit handler
 * @param {HTMLFormElement} form - The form element
 * @param {Object} options - Configuration options
 * @param {Function} options.onSubmit - Async function to handle form data
 * @param {Function} [options.transform] - Optional transform function for raw form data
 * @param {Function} [options.validate] - Optional validation function
 * @param {Function|string} [options.onSuccess] - Success handler (function or preset name)
 * @param {number} [options.successTimeout=3000] - Time to show success state
 * @param {string} [options.messageSel=".response-message"] - Message element selector
 */
export function formHandler(form, options) {
	const {
		onSubmit,
		onSuccess,
		transform,
		validate,
		successTimeout = 3000,
		messageSel = ".response-message",
	} = options
	if (!form) throw new Error("form not found")

	form.addEventListener("submit", async (e) => {
		e.preventDefault()

		const resMsgEl = form.querySelector(messageSel)
		if (!resMsgEl) throw new Error(`No element found: ${messageSel}`)

		const submitData = Object.fromEntries(
			//@ts-ignore
			new FormData(e.target)
		)

		try {
      //? if tranform doesn't contain async func then it will run as synchronous
			const transData = transform ? await transform(submitData) : submitData

			// Run validation if provided
			if (validate) validate(transData)

			// Execute submit handler
			const res = await onSubmit(transData)
			if (!res) throw new Error("No response returned")

			// Handle success
			const successHandler =
				typeof onSuccess === "string" ? successHandlers[onSuccess] : onSuccess

			if (successHandler) {
				successHandler(form, res, { resMsgEl, successTimeout })
			} else {
				// Default success behavior
				form.reset()
				form.setAttribute("data-state", "success")
				resMsgEl.textContent = `ok: ${res.ok} | id: ${res.id}`

				setTimeout(() => {
					form.setAttribute("data-state", "idle")
				}, successTimeout)
			}
		} catch (error) {
			form.setAttribute("data-state", "error")
			console.error("Form submit error:", error)
			resMsgEl.textContent = String(error)
			throw new Error(String(error))
		}
	})
}

/**
 * Creates vote data transform pipeline with metadata
 * @param {Object} metadata - Page metadata to inject
 * @returns {TransformFunction} Composed transform function
 */
const transformVoteData = (metadata) =>
	compose(
		transforms.trimStrings,
		transforms.extractVotes(/^votes\['(.+)'\]$/),
		transforms.votesToFlags,
		transforms.pick("votes"),
		transforms.addTimestamp,
		transforms.metadata(metadata)
		// transforms.getUUID("voterId")
	)

/**
 * Validate vote form data
 * @param {VoteFormData} data - Transformed vote data
 * @throws {Error} If validation fails
 */
function validateVoteData(data) {
	//? only incoming data is the dynamic votes data so... just gonna not validate i guess
	// if (!data.voterId) throw new Error("Voter ID required")
	// if (!data.question._id) throw new Error("Question ID required")
	//? can't validate dynamic raw data
	// if (!data.answers || data.answers.length === 0) {
	// 	throw new Error("At least one answer required")
	// }
}

/**
 * Creates a vote form handler with pre-configured transforms and validation
 * @param {HTMLFormElement} form - The vote form element
 * @param {Object} options - Configuration options
 * @param {Object} options.metadata - Page metadata to inject into form data
 * @param {Function} options.onSubmit - Async function to handle transformed vote data
 * @param {Function} [options.validate] - Optional validation function
 * @param {number} [options.successTimeout] - Time to show success state
 * @param {string} [options.messageSel] - Message element selector
 * @returns {void}
 */
export async function formVoterHandler(form, options) {
	const { metadata, ...handlerOptions } = options
	// TODO fingerprint. save to local storage.
	// check if id is already in questions.voters
	const uuid = await getUserUUID()
	return formHandler(form, {
		transform: transformVoteData({ ...metadata, voterId: uuid }),
		validate: validateVoteData,
		onSuccess: "disable",
		...handlerOptions, // Spread user options (onSubmit, successTimeout, etc.)
	})
}

/**
 * @typedef {Object} SuccessContext
 * @property {HTMLElement} resMsgEl - The response message element
 * @property {number} successTimeout - Timeout duration for success state
 */

/**
 * Pre-defined success handlers for common form patterns
 * @type {Object.<string, Function>}
 */
export const successHandlers = {
	/**
	 * Reset form and show temporary success message
	 * @param {HTMLFormElement} form - The form element
	 * @param {Object} res - Response from onSubmit
	 * @param {SuccessContext} context - Additional context
	 */
	reset: (form, res, { resMsgEl, successTimeout }) => {
		form.reset()
		form.setAttribute("data-state", "success")
		resMsgEl.textContent = `Success! ID: ${res.id || "N/A"}`

		setTimeout(() => {
			form.setAttribute("data-state", "idle")
		}, successTimeout)
	},

	/**
	 * Disable form after successful submission
	 * @param {HTMLFormElement} form - The form element
	 * @param {Object} res - Response from onSubmit
	 * @param {SuccessContext} context - Additional context
	 */
	disable: (form, res, { resMsgEl }) => {
		form.setAttribute("data-state", "success")
		form.setAttribute("disabled", "true")

		// Disable all form inputs
		const inputs = form.querySelectorAll(
			"fieldset, input, textarea, select, button"
		)
		// TODO add this back in after you prevent double submissions (with voterId local storage / finger print flag)
		inputs.forEach((input) => (input.disabled = true))

		resMsgEl.textContent = `Submitted successfully!`
	},

	/**
	 * Reset and disable form
	 * @param {HTMLFormElement} form - The form element
	 * @param {Object} res - Response from onSubmit
	 * @param {SuccessContext} context - Additional context
	 */
	resetAndDisable: (form, res, { resMsgEl }) => {
		form.reset()
		form.setAttribute("data-state", "success")
		form.setAttribute("disabled", "true")

		const inputs = form.querySelectorAll("input, textarea, select, button")
		inputs.forEach((input) => (input.disabled = true))

		resMsgEl.textContent = `Thank you! Your submission has been recorded.`
	},

	/**
	 * Just show success state without resetting
	 * @param {HTMLFormElement} form - The form element
	 * @param {Object} res - Response from onSubmit
	 * @param {SuccessContext} context - Additional context
	 */
	keepData: (form, res, { resMsgEl, successTimeout }) => {
		form.setAttribute("data-state", "success")
		resMsgEl.textContent = `Saved! ID: ${res.id || "N/A"}`

		setTimeout(() => {
			form.setAttribute("data-state", "idle")
		}, successTimeout)
	},

	/**
	 * Redirect to another page after success
	 * @param {string} url - URL to redirect to
	 * @returns {Function} Success handler function
	 */
	redirect:
		(url) =>
		(form, res, { resMsgEl }) => {
			form.setAttribute("data-state", "success")
			resMsgEl.textContent = `Success! Redirecting...`

			setTimeout(() => {
				window.location.href = url
			}, 1500)
		},

	/**
	 * Hide form and show success message
	 * @param {HTMLFormElement} form - The form element
	 * @param {Object} res - Response from onSubmit
	 * @param {SuccessContext} context - Additional context
	 */
	hideForm: (form, res, { resMsgEl }) => {
		form.setAttribute("data-state", "success")
		form.style.display = "none"
		resMsgEl.textContent = `Thank you! Your submission has been received.`
		resMsgEl.style.display = "block"
	},

	/**
	 * Show custom success message based on response
	 * @param {Function} messageFormatter - Function to format success message
	 * @returns {Function} Success handler function
	 */
	customMessage:
		(messageFormatter) =>
		(form, res, { resMsgEl, successTimeout }) => {
			form.reset()
			form.setAttribute("data-state", "success")
			resMsgEl.textContent = messageFormatter(res)

			setTimeout(() => {
				form.setAttribute("data-state", "idle")
			}, successTimeout)
		},
}
