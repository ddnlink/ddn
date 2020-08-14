import BigNumber from 'bignumber.js'

const bignumber = {

  /**
     * 实例化一个大数
     */
  new (...args) {
    return BigNumber(args[0])
  },

  /**
     * 判断数据类型是 BigNumber
     */
  isBigNumber (...args) {
    return BigNumber.isBigNumber(args[0])
  },

  /**
     * 加法操作
     */
  plus (...args) {
    let result = BigNumber(args[0])
    for (let i = 1; i < args.length; i++) {
      result = result.plus(args[i])
    }

    return result
  },

  /**
     * 减法操作
     */
  minus (...args) {
    let result = BigNumber(args[0])
    for (let i = 1; i < args.length; i++) {
      result = result.minus(args[i])
    }
    return result
  },

  /**
     * 乘法操作
     */
  multiply (...args) {
    let result = BigNumber(args[0])
    for (let i = 1; i < args.length; i++) {
      result = result.multipliedBy(args[i])
    }
    return result
  },

  /**
     * 除法操作
     */
  divide (...args) {
    let result = BigNumber(args[0])
    for (let i = 1; i < args.length; i++) {
      result = result.dividedBy(args[i])
    }
    return result
  },

  /**
     * 非数值判断
     */
  isNaN (...args) {
    return BigNumber(args[0]).isNaN()
  },

  /**
     * 零判断
     */
  isZero (...args) {
    return BigNumber(args[0]).isZero()
  },

  /**
     * 相等判断
     */
  isEqualTo (...args) {
    return BigNumber(args[0]).isEqualTo(args[1])
  },

  /**
     * 大于判断
     */
  isGreaterThan (...args) {
    return BigNumber(args[0]).isGreaterThan(args[1])
  },

  /**
     * 大于等于判断
     */
  isGreaterThanOrEqualTo (...args) {
    return BigNumber(args[0]).isGreaterThanOrEqualTo(args[1])
  },

  /**
     * 小于判断
     */
  isLessThan (...args) {
    return BigNumber(args[0]).isLessThan(args[1])
  },

  /**
     * 小于等于判断
     */
  isLessThanOrEqualTo (...args) {
    return BigNumber(args[0]).isLessThanOrEqualTo(args[1])
  },

  /**
     * 绝对值
     */
  abs (...args) {
    return BigNumber(args[0]).absoluteValue()
  },

  /**
     * 取模
     */
  modulo (...args) {
    return BigNumber(args[0]).modulo(args[1])
  },

  /**
     * 最接近的较小整数
     */
  floor (...args) {
    return BigNumber(args[0]).integerValue(BigNumber.ROUND_FLOOR)
  },

  /**
     * 最接近的较大整数
     */
  ceil (...args) {
    return BigNumber(args[0]).integerValue(BigNumber.ROUND_CEIL)
  },

  /**
     * 乘方 POW
     * 返回bigNumber对象
     */
  pow (...args) {
    return BigNumber(args[0]).pow(args[1])
  },

  /**
     * 将byte数组转成16进制大数值
     */
  fromBuffer (buf, opts) {
    if (!opts) opts = {}

    const endian = { 1: 'big', '-1': 'little' }[opts.endian] || opts.endian || 'big'

    const size = opts.size === 'auto' ? Math.ceil(buf.length) : (opts.size || 1)
    if (buf.length % size !== 0) {
      throw new RangeError(`Buffer length (${buf.length}) must be a multiple of size (${size})`
      )
    }

    const hex = []
    for (let i = 0; i < buf.length; i += size) {
      const chunk = []
      for (let j = 0; j < size; j++) {
        chunk.push(buf[
          i + (endian === 'big' ? j : (size - j - 1))
        ])
      }
      hex.push(chunk
        .map(c => {
          return (c < 16 ? '0' : '') + c.toString(16)
        })
        .join('')
      )
    }

    return BigNumber(hex.join(''), 16)
  },

  toBuffer (currBignumber, opts) {
    currBignumber = BigNumber(currBignumber)

    if (typeof opts === 'string') {
      if (opts !== 'mpint') return 'Unsupported Buffer representation'

      const abs = currBignumber.absoluteValue()
      const buf = abs.toBuffer({ size: 1, endian: 'big' })
      let len = buf.length === 1 && buf[0] === 0 ? 0 : buf.length
      if (buf[0] & 0x80) len++

      // Todo: Buffer安全
      const ret = Buffer.allocUnsafe(4 + len)
      if (len > 0) buf.copy(ret, 4 + (buf[0] & 0x80 ? 1 : 0))
      if (buf[0] & 0x80) ret[4] = 0

      ret[0] = len & (0xff << 24)
      ret[1] = len & (0xff << 16)
      ret[2] = len & (0xff << 8)
      ret[3] = len & (0xff << 0)

      // two's compliment for negative integers:
      const isNeg = currBignumber.isLessThan(0)
      if (isNeg) {
        for (let i = 4; i < ret.length; i++) {
          ret[i] = 0xff - ret[i]
        }
      }
      ret[4] = (ret[4] & 0x7f) | (isNeg ? 0x80 : 0)
      if (isNeg) ret[ret.length - 1]++

      return ret
    }

    if (!opts) opts = {}

    const endian = { 1: 'big', '-1': 'little' }[opts.endian] ||
            opts.endian || 'big'

    let hex = currBignumber.toString(16)
    if (hex.charAt(0) === '-') {
      throw new Error(
        'converting negative numbers to Buffers not supported yet'
      )
    }

    const size = opts.size === 'auto' ? Math.ceil(hex.length / 2) : (opts.size || 1)

    var len = Math.ceil(hex.length / (2 * size)) * size
    var buf = Buffer.allocUnsafe(len) // todo: buffer安全

    // zero-pad the hex string so the chunks are all `size` long
    while (hex.length < 2 * len) hex = `0${hex}`

    const hx = hex
      .split(new RegExp(`(.{${2 * size}})`))
      .filter(({ length }) => { return length > 0 })

    hx.forEach((chunk, i) => {
      for (let j = 0; j < size; j++) {
        const ix = i * size + (endian === 'big' ? j : size - j - 1)
        buf[ix] = parseInt(chunk.slice(j * 2, j * 2 + 2), 16)
      }
    })

    return buf
  }

}

export default bignumber
