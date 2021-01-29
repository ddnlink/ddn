import moment from 'moment'

// 主网上线：2020年11月5日上午9点（+8)
const date = new Date(Date.UTC(2020, 10, 4, 16, 0, 0, 0))
const timestamp = date.getTime()
console.log('timestamp == ', timestamp)

const beginDateLocal = moment('2020-11-05 00:00')
console.log('beginDateLocal == ', beginDateLocal.toArray())

const beginDateUTC = beginDateLocal.utc().toArray()
console.log('beginDateUTC == ', beginDateUTC)

const date3 = new Date(Date.UTC(...beginDateUTC))
const timestamp3 = date3.getTime()
console.log('timestamp3 == ', timestamp3)
