import ByteBuffer from 'bytebuffer'

export default {
  evidence: async asset => {
    const bb = new ByteBuffer(1, true)
    bb.writeString(asset.ipid)
    bb.writeString(asset.title)
    bb.writeString(asset.tags)
    bb.writeString(asset.author)
    bb.writeString(asset.url)
    bb.writeString(asset.size)
    bb.writeString(asset.type) // eg: .html, .doc
    bb.writeString(asset.hash)
    bb.flip()

    return bb.toBuffer()
  }
}
