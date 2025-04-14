
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
    [this.States.Syncing]: [this.States.Ready, this.States.Pending, this.States.Fork, this.States.Syncing],
    [this.States.Ready]: [this.States.Syncing, this.States.Fork, this.States.Rollback],
    [this.States.Rollback]: [this.States.Ready, this.States.Syncing],
    [this.States.Fork]: [this.States.Syncing, this.States.Ready]
  }

  /** Constructor: initialize to Pending state */
  constructor() {
    this._state = StateMachine.States.Pending
    this._stateChangeTime = Date.now()
    this._stateHistory = [{
      state: 'Pending',
      timestamp: this._stateChangeTime
    }]
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

    // 如果是相同状态转换，特殊处理
    if (this._state === newState) {
      // 对于 Syncing 状态，允许重新进入同步状态
      if (this._state === StateMachine.States.Syncing) {
        // 只更新时间戳，不抛出错误
        this._stateChangeTime = Date.now();
        return;
      }
    }

    if (!StateMachine.TRANSITIONS[this._state].includes(newState)) {
      const fromState = this._getStateName(this._state);
      const toState = this._getStateName(newState);
      throw new Error(`Invalid state transition from ${fromState} to ${toState}`);
    }

    // 记录状态变更
    const oldState = this._state;
    this._state = newState;
    this._stateChangeTime = Date.now();

    // 记录状态变更历史
    this._stateHistory.push({
      from: this._getStateName(oldState),
      to: this._getStateName(newState),
      timestamp: this._stateChangeTime
    });

    // 保持历史记录在合理范围内
    if (this._stateHistory.length > 100) {
      this._stateHistory = this._stateHistory.slice(-100);
    }
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

  /**
   * 获取当前状态持续时间（毫秒）
   * @returns {number} 状态持续时间
   */
  getStateDuration() {
    return Date.now() - this._stateChangeTime;
  }

  /**
   * 获取状态变更历史
   * @returns {Array} 状态变更历史记录
   */
  getStateHistory() {
    return [...this._stateHistory];
  }

  /**
   * 获取上一次状态变更时间
   * @returns {number} 上次状态变更时间戳
   */
  getLastStateChangeTime() {
    return this._stateChangeTime;
  }
}