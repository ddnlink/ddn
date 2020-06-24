import slots from './slots'

function timeAgo (time) {
  const d = slots.beginEpochTime()
  const t = parseInt(d.getTime() / 1000)

  time = new Date((time + t) * 1000)

  const currentTime = new Date().getTime()
  const diffTime = (currentTime - time.getTime()) / 1000

  if (diffTime < 60) {
    return `${Math.floor(diffTime)} sec ago`
  }
  if (Math.floor(diffTime / 60) <= 1) {
    return `${Math.floor(diffTime / 60)} min ago`
  }
  if ((diffTime / 60) < 60) {
    return `${Math.floor(diffTime / 60)} mins ago`
  }
  if (Math.floor(diffTime / 60 / 60) <= 1) {
    return `${Math.floor(diffTime / 60 / 60)} hour ago`
  }
  if ((diffTime / 60 / 60) < 24) {
    return `${Math.floor(diffTime / 60 / 60)} hours ago`
  }
  if (Math.floor(diffTime / 60 / 60 / 24) <= 1) {
    return `${Math.floor(diffTime / 60 / 60 / 24)} day ago`
  }
  if ((diffTime / 60 / 60 / 24) < 30) {
    return `${Math.floor(diffTime / 60 / 60 / 24)} days ago`
  }
  if (Math.floor(diffTime / 60 / 60 / 24 / 30) <= 1) {
    return `${Math.floor(diffTime / 60 / 60 / 24 / 30)} month ago`
  }
  if ((diffTime / 60 / 60 / 24 / 30) < 12) {
    return `${Math.floor(diffTime / 60 / 60 / 24 / 30)} months ago`
  }
  if (Math.floor((diffTime / 60 / 60 / 24 / 30 / 12)) <= 1) {
    return `${Math.floor(diffTime / 60 / 60 / 24 / 30 / 12)} year ago`
  }

  return `${Math.floor(diffTime / 60 / 60 / 24 / 30 / 12)} years ago`
}

function fullTimestamp (time) {
  let d = slots.beginEpochTime()
  const t = parseInt(d.getTime() / 1000)

  d = new Date((time + t) * 1000)
  let month = d.getMonth() + 1

  if (month < 10) {
    month = `0${month}`
  }

  let day = d.getDate()

  if (day < 10) {
    day = `0${day}`
  }

  let h = d.getHours()
  let m = d.getMinutes()
  let s = d.getSeconds()

  if (h < 10) {
    h = `0${h}`
  }

  if (m < 10) {
    m = `0${m}`
  }

  if (s < 10) {
    s = `0${s}`
  }

  return `${d.getFullYear()}/${month}/${day} ${h}:${m}:${s}`
}

export default {
  timeAgo,
  fullTimestamp
}
