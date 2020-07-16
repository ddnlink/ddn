import ByteBuffer from 'bytebuffer'
import constants from '../../constants'

export default {
  dapp: async dapp => {
    let buf = Buffer.from([])
    const nameBuf = Buffer.from(dapp.name, 'utf8')
    buf = Buffer.concat([buf, nameBuf])

    if (dapp.description) {
      const descriptionBuf = Buffer.from(dapp.description, 'utf8')
      buf = Buffer.concat([buf, descriptionBuf])
    }

    if (dapp.tags) {
      const tagsBuf = Buffer.from(dapp.tags, 'utf8')
      buf = Buffer.concat([buf, tagsBuf])
    }

    if (dapp.link) {
      buf = Buffer.concat([buf, Buffer.from(dapp.link, 'utf8')])
    }

    if (dapp.icon) {
      buf = Buffer.concat([buf, Buffer.from(dapp.icon, 'utf8')])
    }

    const bb = new ByteBuffer(1, true)
    bb.writeInt(dapp.type)
    bb.writeInt(dapp.category)
    if (dapp.delegates) {
      if (dapp.delegates instanceof Array) {
        dapp.delegates = dapp.delegates.join(',')
      }

      bb.writeString(dapp.delegates)
    }
    if (dapp.unlock_delegates || dapp.unlock_delegates === 0) {
      bb.writeInt(dapp.unlock_delegates)
    }
    bb.flip()

    buf = Buffer.concat([buf, bb.toBuffer()])

    return buf
  },

  dappIn: async transfer => {
    let buf = Buffer.from([])
    const dappId = Buffer.from(transfer.dapp_id, 'utf8')

    if (transfer.currency !== constants.tokenName) {
      const currency = Buffer.from(transfer.currency, 'utf8')
      const amount = Buffer.from(transfer.amount, 'utf8')
      buf = Buffer.concat([buf, dappId, currency, amount])
    } else {
      const currency = Buffer.from(transfer.currency, 'utf8')
      buf = Buffer.concat([buf, dappId, currency])
    }

    return buf
  },

  dappOut: async transfer => {
    let buf = Buffer.from([])
    const dappId = Buffer.from(transfer.dapp_id, 'utf8')

    if (transfer.currency !== constants.tokenName) {
      const currency = Buffer.from(transfer.currency, 'utf8')
      const amount = Buffer.from(transfer.amount, 'utf8')
      buf = Buffer.concat([buf, dappId, currency, amount])
    } else {
      const currency = Buffer.from(transfer.currency, 'utf8')
      buf = Buffer.concat([buf, dappId, currency])
    }

    return buf
  }
}
