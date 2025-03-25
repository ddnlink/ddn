
/**
 * Core state machine class for managing runtime states
 * @class StateMachine
 */
export class StateMachine {
  // State enumeration
  static States = {
    /** Initial state, waiting for initialization */
    Pending: 0,
    /** Syncing state, fetching latest blocks */
    Syncing: 1,
    /** Ready state, normal operation */
    Ready: 2,
    /** Rollback state, reverting blocks */
    Rollback: 3,
    /** Fork state, handling chain fork */
    Fork: 4
  }

  // State transition rules
  static TRANSITIONS = {
    [this.States.Pending]: [this.States.Ready, this.States.Syncing, this.States.Rollback],
    [this.States.Syncing]: [this.States.Ready, this.States.Pending, this.States.Fork],
    [this.States.Ready]: [this.States.Syncing, this.States.Fork, this.States.Rollback],
    [this.States.Rollback]: [this.States.Ready, this.States.Syncing],
    [this.States.Fork]: [this.States.Syncing, this.States.Ready]
  }

  /** Constructor: initialize to Pending state */
  constructor() {
    this._state = StateMachine.States.Pending
  }

  /**
   * Transition to new state
   * @param {number|string} newState - Target state (code or name)
   * @throws {Error} On invalid transition
   */
  transitionTo(newState) {
    if (typeof newState === 'string') {
      newState = StateMachine.States[newState];
      if (newState === undefined) {
        throw new Error(`Invalid state name: ${newState}`);
      }
    }

    if (!StateMachine.TRANSITIONS[this._state].includes(newState)) {
      const fromState = this._getStateName(this._state);
      const toState = this._getStateName(newState);
      throw new Error(`Invalid state transition from ${fromState} to ${toState}`);
    }
    this._state = newState;
  }

  // Semantic transition methods
  transitionToPending() { this.transitionTo('Pending'); }
  transitionToSyncing() { this.transitionTo('Syncing'); }
  transitionToReady() { this.transitionTo('Ready'); }
  transitionToRollback() { this.transitionTo('Rollback'); }
  transitionToFork() { this.transitionTo('Fork'); }

  /**
   * Convert state code to name
   * @param {number} code - State code
   * @returns {string} State name or code
   */
  _getStateName(code) {
    return Object.keys(StateMachine.States).find(k => StateMachine.States[k] === code) || code;
  }

  // State check methods
  isPending() { return this._state === StateMachine.States.Pending; }
  isSyncing() { return this._state === StateMachine.States.Syncing; }
  isReady() { return this._state === StateMachine.States.Ready; }
  isForking() { return this._state === StateMachine.States.Fork; }
  isRollingBack() { return this._state === StateMachine.States.Rollback; }

  /**
   * Current state accessor (read-only)
   * @returns {number} Current state code
   */
  get current() {
    return this._state;
  }
}