/* ---------------------------------------------------------------------------------------------
 *  Created by DDN Team on Tue Apr 10 2017 16:22:31
 *
 *  Copyright (c) 2019 DDN Foundation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

import EventEmitter from 'events'

import changeCase from 'change-case'

/**
 * 订阅/广播类
 *
 * 接收者通过调用订阅方法进行注册
 * subscribe(接收者对象)
 *
 * 通过广播方法进行消息广播
 *
 * ```
 * library.bus.message('blockchainReady');
 * ```
 *
 * 将会调用系统所有模块的同一个方法（onBlockchainReady）
 */
class Bus extends EventEmitter {
  constructor () {
    super()
    this._subscribers = []
  }

  /**
   * 订阅消息
   * @param {*} obj
   */
  subscribe (obj) {
    if (!this._subscribers.includes(obj)) {
      this._subscribers.push(obj)
    }
  }

  /**
   * 取消消息订阅
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
   * 发布消息，第一个参数是消息名，依次调用订阅者的同名函数（on开头，消息第一个字母大写），后面参数作为函数参数
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
