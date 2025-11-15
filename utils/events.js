/**
 * Custom event names for gameStateManager dispatch
 */
export const EVENT_TYPES = {
  STATE_CHANGED: 'game:stateChanged',
  ANSWER_REVEALED: 'game:answerRevealed',
  SET_STRIKES: 'game:setStrikes',
  TEAM_ACTIVE: 'game:teamActive',
  TEAM_RENAME: 'game:teamRename',
  TEAM_UPDATE: 'game:updateTeam',
  AWARD_POINTS: 'game:awardPoints',
  ROUNDSTEAL_SET: 'game:roundSteal',
  NEXT_ROUND: 'game:nextRound',
  UPDATE_POINTS: 'game:updatePoints',
  SET_ROUNDPHASE: 'game:setRoundPhase',
  END_ROUND: 'game:endRound'
};

export const events = new EventTarget();