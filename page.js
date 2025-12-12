import { getElementById } from "./components.js"
import { getAllQuestionIds } from "./db.js"

const playRandomLinkEl = getElementById("play-random", HTMLAnchorElement)

async function init() {
	const ids = await getAllQuestionIds()
	if (!ids) throw new Error("NO IDS FOUND")
	const randomId = ids[Math.floor(Math.random() * ids?.length)]
	playRandomLinkEl.href = `/play/index.html?id=${randomId}`
}

document.addEventListener("DOMContentLoaded", function () {
	console.log("DOMContentLoaded fired") // Check if event fires
	init()
})
