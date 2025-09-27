type Emoji = import('../types/Emoji.js').Emoji

export type PouchDBChange = {
	direction: "push" | "pull"
  change: {
    ok: boolean
    start_time: string
    docs_read: number
    docs_written: number
    docs_write_failures: number
    errors: any[]
    last_seq: number
    docs: Emoji[]

  }
}
