/**
 * Custom event names for gameStateManager dispatch
 */
export const EVENT_TYPES = {
	BUZZER_A_PRESSED: "buzzer:a_buzzed",
	BUZZER_B_PRESSED: "buzzer:b_buzzed",
	STATE_CHANGED: "game:stateChanged",
	ANSWER_REVEALED: "game:answerRevealed",
	SET_STRIKES: "game:setStrikes",
	TEAM_ACTIVE: "game:teamActive",
	TEAM_RENAME: "game:teamRename",
	TEAM_UPDATE: "game:updateTeam",
	AWARD_POINTS: "game:awardPoints",
	ROUNDSTEAL_SET: "game:roundSteal",
	NEXT_ROUND: "game:nextRound",
	UPDATE_POINTS: "game:updatePoints",
	SET_ROUNDPHASE: "game:setRoundPhase",
	END_ROUND: "game:endRound",
	GAME_WINNER: "game:winner",
}
export const events = new EventTarget()

//? add strings to BroadcastChannels.d.ts BC_TYPE
export const CHANNEL_TYPES = {
	TEAM_UPDATE: "game:teamUpdate",
	UPDATE_POINTS: "game:updatePoints",
	SET_STRIKES: "game:setStrikes",
}
export const gameChannel = new BroadcastChannel("game-broadcastchannel")
export const buzzerChannel = new BroadcastChannel("game-show-buzzer")
