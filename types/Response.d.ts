import { Emoji } from "./Emoji"
import { Message } from "./Messages"

export type Response =
	| {
			ok: true
			error?: false
			message: string
			docs?: Emoji[] | Message[]
	  }
	| {
			ok?: false
			error: true
			message: string
	  }
