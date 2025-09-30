/**
 * Creates a reusable form submit handler
 * @param {HTMLFormElement} form - The form element
 * @param {Object} options - Configuration options
 * @param {Function} options.onSubmit - Async function to handle form data
 * @param {Function} [options.validate] - Optional validation function
 * @param {number} [options.successTimeout=3000] - Time to show success state
 * @param {string} [options.messageSel=".response-message"] - Message element selector
 */
export function formHandler(form, options) {
	const {
		onSubmit,
		validate,
		successTimeout = 3000,
		messageSel = ".response-message",
	} = options
	if (!form) throw new Error("form not found")

	form.addEventListener("submit", async (e) => {
		e.preventDefault()

		const resMsgEl = form.querySelector(messageSel)
		if (!resMsgEl) throw new Error(`No element found: ${messageSel}`)

		const formData = Object.fromEntries(
			//@ts-ignore
			new FormData(e.target)
		)

		try {
			// Run validation if provided
			if (validate) {
				validate(formData)
			}

			// Execute submit handler
			const res = await onSubmit(formData)
			if (!res) throw new Error("No response returned")

			form.reset()
			form.setAttribute("data-state", "success")
			resMsgEl.textContent = `ok: ${res.ok} | id: ${res.id}`

			setTimeout(() => {
				form.setAttribute("data-state", "idle")
			}, successTimeout)
		} catch (error) {
			form.setAttribute("data-state", "error")
			console.error("Form submit error:", error)
			resMsgEl.textContent = String(error)
		}
	})
}
