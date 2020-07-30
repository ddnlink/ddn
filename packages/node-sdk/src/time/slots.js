import { constants } from '../config'

const interval = constants.interval
const delegates = constants.delegates

/**
 * 周期开始时间
 */
function beginEpochTime () {
  return constants.net.beginDate
}

/**
 * 周期时间
 * @param {time} time 为空时，默认为当前时间开始计算
 */
function getEpochTime (time) {
  if (time === undefined) {
    time = (new Date()).getTime()
  }
  const d = beginEpochTime()
  const t = d.getTime()
  return Math.floor((time - t) / 1000)
}

function getTime (time) {
  return getEpochTime(time)
}

function getRealTime (epochTime) {
  if (epochTime === undefined) {
    epochTime = getTime()
  }
  const d = beginEpochTime()
  const t = Math.floor(d.getTime() / 1000) * 1000
  return t + epochTime * 1000
}

function getSlotNumber (epochTime) {
  if (epochTime === undefined) {
    epochTime = getTime()
  }
  const interval = constants.interval

  return Math.floor(epochTime / interval)
}

function getSlotTime (slot) {
  return slot * interval
}

function getNextSlot () {
  const slot = getSlotNumber()

  return slot + 1
}

function getLastSlot (nextSlot) {
  return nextSlot + delegates
}

export {
  interval,
  delegates,
  getTime,
  getRealTime,
  getSlotNumber,
  getSlotTime,
  getNextSlot,
  getLastSlot,
  beginEpochTime
}

export default {
  interval,
  delegates,
  getTime,
  getRealTime,
  getSlotNumber,
  getSlotTime,
  getNextSlot,
  getLastSlot,
  beginEpochTime
}
