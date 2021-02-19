/* ---------------------------------------------------------------------------------------------
 *  Created by DDN Team on Tue Apr 10 2017 16:22:31
 *
 *  Copyright (c) 2019 DDN Foundation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

import EventEmitter from 'events'

import changeCase from 'change-case'

/**
 *
 * subscription / broadcast
 *
 * the receiver registers by calling the subscription method
 * subscribe(receiver)
 *
 * broadcast the message
 * ```
 * this.bus.message('blockchainReady');
 * ```
 * the same method(onBlockchainReady) for all modules of the system will be called
 *
 */
class Bus extends EventEmitter {
  constructor () {
    super()
    this._subscribers = []
  }

  /**
   * @description subscribe message
   * @param {*} obj
   */
  subscribe (obj) {
    if (!this._subscribers.includes(obj)) {
      this._subscribers.push(obj)
    }
  }

  /**
   * @description unsubscribe
   * @param {*} obj
   */
  unsubscribe (obj) {
    for (let i = 0; i < this._subscribers.length; i++) {
      if (obj === this._subscribers[i]) {
        this._subscribers.splice(i, 1)
        break
      }
    }
  }

  /**
   * @description publish the message, all the subscriber will be called
   * @param topic
   * @param args[] other params pass to the event
   */
  publish () {
    const args = []
    Array.prototype.push.apply(args, arguments)
    const topic = args.shift()
    this._subscribers.forEach(subscriber => {
      const eventName = `on${changeCase.pascalCase(topic)}`
      if (typeof subscriber[eventName] === 'function') {
        subscriber[eventName].apply(subscriber[eventName], args)
      }
    })
    this.emit(...arguments)
  }
}

export default Bus
