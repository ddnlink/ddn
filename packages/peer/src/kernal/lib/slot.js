/**
 * Slot
 * wangxm   2018-01-07
 */
import constants from '../../constants'

let _singleton

class Slot {
  static singleton (context) {
    if (!_singleton) {
      _singleton = new Slot(context)
    }
    return _singleton
  }

  constructor (context) {
    Object.assign(this, context)
    this._context = context
    this.interval = constants.interval
    this.delegates = constants.delegates
  }

  /**
     * 返回区块链启动时间戳
     */
  beginEpochTime () {
    return constants[this.config.net].beginDate
  }

  /**
     * 将系统时间戳计算成区块链时间戳（时间戳和区块链启动时间戳的差）
     * @param {*} time
     */
  getEpochTime (time) {
    if (time === undefined) {
      time = (new Date()).getTime()
    }
    const d = this.beginEpochTime()
    const t = d.getTime()

    // console.log("t, time", t, time);

    return Math.floor((time - t) / 1000)
  }

  /**
     * 获取区块链时间戳
     * @param {*} time
     */
  getTime (time) {
    return this.getEpochTime(time)
  }

  getRealTime (epochTime) {
    if (epochTime === undefined) {
      epochTime = this.getTime()
    }
    const d = this.beginEpochTime()
    const t = Math.floor(d.getTime() / 1000) * 1000
    return t + epochTime * 1000
  }

  getSlotNumber (epochTime) {
    if (epochTime === undefined) {
      epochTime = this.getTime()
    }
    return Math.floor(epochTime / this.interval)
  }

  getSlotTime (slot) {
    return slot * this.interval
  }

  getNextSlot () {
    const slot = this.getSlotNumber()
    return slot + 1
  }

  getLastSlot (nextSlot) {
    return nextSlot + this.delegates
  }
}

export default Slot
