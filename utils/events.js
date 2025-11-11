// events.js

/**
 * Custom event names
 */
export const EVENT_TYPES = {
  STATE_CHANGED: 'game:stateChanged',
  ANSWER_REVEALED: 'game:answerRevealed',
  SET_STRIKES: 'game:setStrikes',
  TEAM_ACTIVE: 'game:teamActive',
  TEAM_RENAME: 'game:teamRename',
  AWARD_POINTS: 'game:awardPoints',
  ROUNDSTEAL_SET: 'game:roundSteal',
  NEXT_ROUND: 'game:nextRound',
  UPDATE_POINTS: 'game:updatePoints'
};

export const events = new EventTarget();