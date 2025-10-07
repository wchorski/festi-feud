/*
 * Copyright 2011 Daniel Seither (post@tiwoc.de)
 *
 * This file is part of Clan Contest.
 *
 * Clan Contest is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Clan Contest is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Clan Contest. If not, see http://www.gnu.org/licenses/.
 */

/**
 * State
 * 
 * Handles changes to a set of state variables, providing undo/redo.
 * Convention: elements starting with an underscore should not be used from outside the containing object
 * 
 * Please note:
 * * If undo/redo listeners should be used, these must be registered before any other use of the object.
 * * After creating a State object and before using it normally, submit initial state using commit_changes, writing to all state variables.
 */

/**
 * Constructor for State objects
 * @param {Function} publish_changes - Function to be called with the changes to be distributed to the change receivers
 */
export class State {
  constructor(publish_changes) {
    /**
     * Undo history
     * @type {Array<Object.<string, any>>}
     * @private
     */
    this._history = [];

    /**
     * Redo future changes
     * @type {Array<Object.<string, any>>}
     * @private
     */
    this._future = [];

    /**
     * Undo listener callback
     * @type {Function}
     * @private
     */
    this._undo_listener = function (can_undo) { };

    /**
     * Redo listener callback
     * @type {Function}
     * @private
     */
    this._redo_listener = function (can_redo) { };

    /**
     * Function to be called when changes should be effected
     * @type {Function}
     * @private
     */
    this._publish_changes = publish_changes;
  }
  /**
   * Entry point for changelists; call this to do changes
   * @param {Object.<string, any>} changes - Changes to commit
   * @returns {void}
   */
  commit_changes(changes) {
    this._future = [];
    this._history.push(changes);
    this._publish_changes(changes);

    // nothing can be redone since a new change is committed
    this._redo_listener(false);

    // enable undo if something other than the initial state is left to be undone
    this._undo_listener(this._history.length > 1);
  }
  /**
   * Undo last change
   * @returns {void}
   */
  undo() {
    // undo latest change
    const changes = this._history.pop();
    this._future.push(changes);
    this._publish_changes(this.get_consolidated());

    // undone change can be redone
    this._redo_listener(true);

    // enable undo if something other than the initial state is left to be undone
    this._undo_listener(this._history.length > 1);
  }
  /**
   * Redo latest undone change
   * @returns {void}
   */
  redo() {
    // re-publish changes
    const changes = this._future.pop();
    this._history.push(changes);
    this._publish_changes(changes);

    // enable redo if something is left to be redone
    this._redo_listener((this._future.length > 0));

    // enable undo
    this._undo_listener(true);
  }
  /**
   * The given function is called to update the undo state (can undo [y/n])
   * @param {Function} listener - Callback function that receives a boolean indicating if undo is available
   * @returns {void}
   */
  set_undo_listener(listener) {
    this._undo_listener = listener;
  }
  /**
   * The given function is called to update the redo state (can redo [y/n])
   * @param {Function} listener - Callback function that receives a boolean indicating if redo is available
   * @returns {void}
   */
  set_redo_listener(listener) {
    this._redo_listener = listener;
  }
  /**
   * Use the history of changes to calculate the current state of each setting
   * @returns {Object.<string, any>} Consolidated state object
   */
  get_consolidated() {
    const consolidated = {};

    // replay all changes chronologically, letting newer entries overwrite older entries of the same setting
    this._history.forEach((changes) => {
      Object.entries(changes).forEach(([setting, value]) => {
        consolidated[setting] = value;
      });
    });

    return consolidated;
  }
}






