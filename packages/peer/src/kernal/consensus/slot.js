/**
 * Slot
 * wangxm   2018-01-07
 */
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
    this._interval = this.constants.interval
    this._delegates = this.constants.delegates
  }

  /**
   * 返回区块链启动时间戳
   */
  beginEpochTime () {
    return this.constants.net.beginDate
  }

  /**
   * 将系统时间戳计算成区块链时间戳（时间戳和区块链启动时间戳的差）
   * @param {*} time
   */
  getEpochTime (time) {
    if (time === undefined) {
      time = new Date().getTime()
    }
    const d = this.beginEpochTime()
    const t = d.getTime()

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

    return Math.floor(epochTime / this._interval)
  }

  getSlotTime (slot) {
    return slot * this._interval
  }

  getNextSlot () {
    const slot = this.getSlotNumber()
    return slot + 1
  }

  getLastSlot (nextSlot) {
    return nextSlot + this._delegates
  }
}

export default Slot
