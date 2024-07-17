import crypto from 'crypto'
import { isBinary, isText } from './util'

/**
 * @
 */
export class Message {
  /**
   *
   * @param {*} version string, 2 char, like v1,v2
   * @param {*} nethash string, 8 char, like 0ab796cd
   */
  constructor (options) {
    options = options || {}
    this.version = options.version || 'v1'
    this.nethash = options.nethash || '0ab796cd'
    this.logger = options.logger || console

    this._header = `${Message.PRIFIX}//${this.version}@${this.nethash}`
    this._header_size = this._header.length
    this.minPacketSize = this._header_size + 8 // header_size + 4(size field) + 2(cmd field) + 2(serial field)
  }

  /**
   * calc md5 checksum of data
   * @param {*} buf
   * @returns 32 byte hash
   */
  static checksum (buf) {
    return crypto.createHash('md5').update(buf).digest().slice(0, 16).toString('hex')
  }

  /**
   * test the data type
   * @param {*} data
   * @returns get md5 checksum
   */
  static getDataType (data) {
    return isText(data) ? Message.types.TEXT : (isBinary(data) ? Message.types.BINARY : Message.types.JSON)
  }

  /**
   *
   * @param {*} data
   */
  static getMetadata (data) {
    // 0 等数字, false, true, 按对像处理; null 是对象; '', "" 是string
    if (data === undefined) return { size: 0 }

    const type = Message.getDataType(data)
    const payload = type === Message.types.BINARY ? data : Buffer.from(type === Message.types.JSON ? JSON.stringify(data) : data)
    const checksum = Message.checksum(payload)
    // this.logger.debug(`send payload size: ${payload.length}`, payload)
    return { type, checksum, payload, size: payload.length }
  }

  _findHeader (dataBuffer) {
    let i = 0
    for (;;) {
      // check if it's the beginning of a new message
      const header = dataBuffer.slice(0, this._header_size).toString()
      if (header === this._header) {
        dataBuffer.discard(i)
        return true
      }

      // did we reach the end of the buffer?
      if (i > (dataBuffer.length - this._header_size)) {
        dataBuffer.discard(i)
        return false
      }

      i++ // continue scanning
    }
  }

  /**
   *
   * @param {*} cmd
   * @param {*} data
   */
  packet (cmd, data, meta, serial) {
    if (typeof cmd !== 'number' || cmd < 0 || cmd > 65535) {
      this.logger.warn(`It's not a ligal p2p command: ${cmd}.`)
      return
    }

    const isUnary = meta === undefined && data === undefined
    const header_size = this._header_size
    const buf = Buffer.alloc(header_size + 8 + (isUnary ? 0 : 2))

    buf.write(this._header)
    buf.writeUInt16LE(serial, header_size + 4)
    buf.writeUInt16LE(cmd, header_size + 6)
    if (isUnary) { // 0 等数字, false, true, 按对像处理; null 是对象; '', "" 是string
      buf.writeUInt32LE(this.minPacketSize, header_size)
      return buf
    }

    let metadata, payload
    if (cmd === Message.commands.PUSH) { // 廣播的數據已經進行過處理
      metadata = meta || {}
      payload = data
    } else {
      const { type, checksum, size, payload: buf } = Message.getMetadata(data)
      metadata = { ...meta, type, checksum, size }
      payload = buf
    }
    const metabuf = Buffer.from(JSON.stringify(metadata))

    buf.writeUInt32LE(metabuf.length + 10 + header_size + metadata.size, header_size) // size includes type, checksum and payload
    buf.writeUInt16LE(metabuf.length + 10 + header_size, header_size + 8)

    // this.logger.debug(`send payload size: ${payload.length}`, payload)
    return payload ? Buffer.concat([buf, metabuf, payload]) : Buffer.concat([buf, metabuf])
  }

  /**
   *
   * @param {*} data
   */
  unpack (bufs) {
    // 如果大於最小包，繼續，否則返回
    if (bufs.length < this.minPacketSize) {
      this.logger.warn('Discard invalid bufs: ', bufs)
      return
    }
    // 找不到包頭， 返回
    if (!this._findHeader(bufs)) {
      this.logger.warn('Not found header', bufs)
      return
    }

    const header_size = this._header_size
    const packet_size = bufs.slice(header_size, header_size + 4).readUInt32LE()
    // 含有负载，如果缓存数据 < 包大小，返回，等待下次处理，此时不移动游標
    // 包大小 =  头 + 长度 + 序列号 + 命令 + 元數據長度 +   元數據    +  负载长度
    // 即大小 =  头 +  4  +    2   +  2   +     2     +  metasize   +   size
    if (bufs.length < packet_size) {
      this.logger.warn(`Buffers length is not right, expect: ${packet_size}, get: ${bufs.length}`, bufs)
      return
    }

    const serial = bufs.slice(header_size + 4, header_size + 6).readUInt16LE()
    const cmd = bufs.slice(header_size + 6, header_size + 8).readUInt16LE()
    // 如果负载为0， 直接返回
    if (packet_size <= this.minPacketSize) {
      bufs.discard(packet_size)
      return { serial, cmd }
    }

    const metastart = header_size + 10
    const metaend = bufs.slice(header_size + 8, metastart).readUInt16LE()
    const metadata = bufs.slice(metastart, metaend)
    const payload = bufs.slice(metaend, packet_size)

    // read message successed, discard it from buffer
    bufs.discard(packet_size)
    const meta = JSON.parse(metadata)
    if (!meta.size) {
      return { serial, cmd, meta }
    }
    const checksum_calc = Message.checksum(payload).toString('hex')
    if (meta.checksum !== checksum_calc) {
      this.logger.warn(`invalid data payload, checksum is not right, expected: ${meta.checksum}, but got: ${checksum_calc}`)
      return
    }

    const data = meta.type === Message.types.JSON ? JSON.parse(payload) : (meta.type === Message.types.TEXT ? payload.toString() : payload)
    return { serial, cmd, meta, data }
  }
}

Message.PRIFIX = 'ddn:p2p'
Message.MAX_PACKET_SIZE = 10485760 // 10 Mb

Message.types = {
  TEXT: 0,
  BINARY: 1,
  JSON: 2
}

Message.commands = {
  // 基础命令
  PING: 1,
  PONG: 2,

  // p2p命令
  VERSION: 11,
  INVENTORY: 12,

  // 应用层命令
  GET: 21,
  PUT: 22,
  POST: 23,
  DELETE: 24,

  RESPONSE: 25,

  PUSH: 31,

  // 错误
  NOTFOUND: 104,
  REFUSED: 105
}

Message.methods = {
  // 基础命令
  1: 'PING',
  2: 'PONG',
  // p2p命令
  11: 'VERSION',
  12: 'INVENTORY',

  21: 'GET',
  22: 'PUT',
  23: 'POST',
  24: 'DELETE',

  25: 'RESPONSE',

  31: 'PUSH',

  // 错误
  104: 'NOTFOUND',
  105: 'REJECT'
}

Message.unary = [
  Message.commands.PING,
  Message.commands.PONG,
  Message.commands.VERSION,
  Message.commands.INVENTORY
]
