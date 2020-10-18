/**
 * 这里的方法来自各个交易类型里对应的 getBytes 方法，两者要保持一致，必然会出现 id 不一致或验证失败的问题
 */
import ByteBuffer from 'bytebuffer'

const aobIssuer = async asset => {
  // const bb = new ByteBuffer()
  // bb.writeString(asset.name)
  // bb.writeString(asset.desc)

  // bb.flip()
  // return bb.toBuffer()

  const buffer = Buffer.concat([Buffer.from(asset.name, 'utf8'), Buffer.from(asset.desc || '', 'utf8')])
  return buffer
}

const aobAsset = async asset => {
  let buffer = Buffer.concat([
    Buffer.from(asset.name, 'utf8'),
    Buffer.from(asset.desc || '', 'utf8'),
    Buffer.from(asset.maximum, 'utf8'),
    Buffer.from([asset.precision || 0]),
    Buffer.from([asset.allow_writeoff || '0']),
    Buffer.from([asset.allow_whitelist || '0']),
    Buffer.from([asset.allow_blacklist || '0'])
  ])

  if (asset.strategy) {
    buffer = Buffer.concat([Buffer.from(asset.strategy, 'utf8')])
  }
  return buffer
}

const aobFlags = async asset => {
  const buffer = Buffer.concat([
    Buffer.from(asset.currency, 'utf8'),
    Buffer.from([asset.flag || 0]),
    Buffer.from([asset.flag_type || '0'])
  ])

  return buffer
}

const aobAcl = async asset => {
  const bb = new ByteBuffer()
  bb.writeString(asset.currency)
  bb.writeString(asset.operator)
  bb.writeByte(asset.flag)

  if (asset.list) {
    bb.writeString(asset.list)
  }

  bb.flip()

  return bb.toBuffer()
}

const aobIssue = async asset => {
  const buffer = Buffer.concat([Buffer.from(asset.currency, 'utf8'), Buffer.from(asset.amount, 'utf8')])

  return buffer
}

const aobTransfer = async asset => {
  const buffer = Buffer.concat([
    Buffer.from(asset.currency, 'utf8'),
    Buffer.from(asset.amount, 'utf8'),
    Buffer.from(asset.content || '', 'utf8')
  ])

  return buffer
}

export default {
  aobIssuer,
  aobAsset,
  aobFlags,
  aobIssue,
  aobTransfer,
  aobAcl
}
