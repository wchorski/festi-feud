// IIFE to avoid global scope pollution and prevent "Cannot redeclare" errors

import { getElementById } from "../components.js"

//? may remove this wrap cuz i prob don't need it.
;(function () {
	"use strict"

	const openBtn = getElementById("openPopup", HTMLButtonElement)
	const closeBtn = getElementById("closePopup", HTMLButtonElement)
	const textInput = getElementById("textInput", HTMLInputElement)
	const updateBtn = getElementById("updateText", HTMLButtonElement)
	const colorBtn = getElementById("changeColor", HTMLButtonElement)
	const addBtn = getElementById("addElement", HTMLButtonElement)

	/** @type {Window | null} */
	let popupWindow = null

	/** @returns {void} */
	function openPopup() {

		const features =
			"width=600,height=400,left=100,top=100,menubar=no,toolbar=no,location=no,status=no,scrollbars=yes"

		// Open the popup with the external HTML file
		popupWindow = window.open("popup.html", "PopupWindow", features)

		if (popupWindow) {
			openBtn.disabled = true
			closeBtn.disabled = false

			// Check if popup is closed
			const checkClosed = setInterval(() => {
				if (popupWindow && popupWindow.closed) {
					clearInterval(checkClosed)
					handlePopupClosed()
				}
			}, 500)
		}
	}

	/** @returns {void} */
	function closePopup() {
		if (popupWindow && !popupWindow.closed) {
			popupWindow.close()
		}
		handlePopupClosed()
	}

	/** @returns {void} */
	function handlePopupClosed() {
		popupWindow = null
		openBtn.disabled = false
		closeBtn.disabled = true
	}

	/** @returns {void} */
	function updatePopupText() {
		if (!popupWindow || popupWindow.closed) {
			alert("Popup is not open!")
			return
		}

		const text = textInput.value
		const contentDiv = popupWindow.document.getElementById("content")

		if (!contentDiv) {
			throw new Error('Element with id "content" not found in popup window')
		}

		contentDiv.textContent = text || "No text entered"
	}

	/** @returns {void} */
	function changePopupColor() {
		if (!popupWindow || popupWindow.closed) {
			alert("Popup is not open!")
			return
		}

		const colors = ["#ffcccc", "#ccffcc", "#ccccff", "#ffffcc", "#ffccff"]
		const randomColor = colors[Math.floor(Math.random() * colors.length)]
		popupWindow.document.body.style.backgroundColor = randomColor
	}

	/** @returns {void} */
	function addElementToPopup() {
		if (!popupWindow || popupWindow.closed) {
			alert("Popup is not open!")
			return
		}

		const container = popupWindow.document.getElementById("dynamicContainer")

		if (!container) {
			throw new Error(
				'Element with id "dynamicContainer" not found in popup window'
			)
		}

		const newElement = popupWindow.document.createElement("p")
		newElement.textContent = `Element added at ${new Date().toLocaleTimeString()}`
		container.appendChild(newElement)
	}

	// Event listeners
	openBtn.addEventListener("pointerup", openPopup)
	closeBtn.addEventListener("pointerup", closePopup)
	updateBtn.addEventListener("pointerup", updatePopupText)
	colorBtn.addEventListener("pointerup", changePopupColor)
	addBtn.addEventListener("pointerup", addElementToPopup)
})()
