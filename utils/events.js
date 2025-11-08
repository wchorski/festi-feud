// events.js

/**
 * Custom event names
 */
export const EVENT_TYPES = {
  STATE_CHANGED: 'game:stateChanged',
  ANSWER_REVEALED: 'game:answerRevealed',
  STRIKES_SET: 'game:setStrikes',
  TEAM_ACTIVE: 'game:teamActive',
  TEAM_RENAME: 'game:teamRename',
  ROUND_ENDED: 'game:roundEnded',
  UPDATE_POINTS: 'game:updatePoints'
};

export const events = new EventTarget();