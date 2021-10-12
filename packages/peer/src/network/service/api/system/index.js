/**
 * 获取服务器相关信息接口
 * creazy   2021-09-23
 */
const si = require('systeminformation')

class Systeminformation {
  constructor (context) {
    Object.assign(this, context)
    this._context = context
  }

  async get (req) {
    const byteToGbUnit = 1024 * 1024 * 1024
    const memory = await si.mem()
    memory.total = memory.total / byteToGbUnit
    memory.free = memory.total / byteToGbUnit
    memory.available = memory.available / byteToGbUnit
    const os = await si.osInfo()
    const disk = await si.diskLayout()
    disk.map(item => {
      item.size = item.size / byteToGbUnit
    })
    const net = await si.networkInterfaces()
    const fsSize = await si.fsSize()
    fsSize.map(item => {
      item.available = item.available / byteToGbUnit
      item.size = item.size / byteToGbUnit
    })
    const perNet = await si.networkStats()
    console.log(disk, fsSize)
    return {
      success: true,
      memory,
      os,
      disk,
      net,
      fsSize,
      perNet
    }
  }
}

export default Systeminformation
