import ByteBuffer from 'bytebuffer'

export default {
  daoOrg: async (org) => {
    const bb = new ByteBuffer()
    if (!org) {
      return null
    }
    try {
      bb.writeUTF8String(org.org_id.toLowerCase())
      bb.writeUTF8String(org.name ? org.name : '')
      bb.writeUTF8String(org.address ? org.address : '')
      bb.writeUTF8String(org.url ? org.url : '')
      bb.writeUTF8String(org.tags ? org.tags : '')
      bb.writeInt8(org.state)
      bb.flip()
    } catch (e) {
      throw Error(e.toString())
    }
    return bb.toBuffer()
  },

  daoExchange: async (asset) => {
    const bb = new ByteBuffer()
    bb.writeString(asset.org_id.toLowerCase())
    bb.writeString(asset.exchange_trs_id)
    bb.writeString(asset.price)
    bb.writeInt8(asset.state)
    bb.writeString(asset.sender_address)
    bb.writeString(asset.received_address)
    bb.flip()
    return bb.toBuffer()
  },

  daoContribution: async (asset) => {
    const bb = new ByteBuffer()
    bb.writeUTF8String(asset.title)
    bb.writeUTF8String(asset.received_address)
    bb.writeUTF8String(asset.sender_address)
    bb.writeUTF8String(asset.price)
    bb.writeUTF8String(asset.url)
    bb.flip()
    return bb.toBuffer()
  },

  daoConfirmation: async (asset) => {
    const bb = new ByteBuffer()
    bb.writeUTF8String(asset.received_address)
    bb.writeUTF8String(asset.sender_address)
    bb.writeUTF8String(asset.url)
    bb.writeInt8(asset.state)
    bb.writeUTF8String(asset.contribution_trs_id)
    bb.flip()
    return bb.toBuffer()
  }
}
