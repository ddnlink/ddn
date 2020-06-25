import ByteBuffer from 'bytebuffer'
import Asset from '@ddn/asset-base'

class Evidence extends Asset.Base {
  async propsMapping () {
    return [
      { field: 'str4', prop: 'ipid', required: true, maxLen: 64 },
      { field: 'str6', prop: 'title', required: true, maxLen: 128 },
      { field: 'str8', prop: 'description' },
      { field: 'str7', prop: 'hash', required: true, maxLen: 128 },
      { field: 'str5', prop: 'tags' },
      { field: 'str3', prop: 'author', required: true, maxLen: 20 },
      { field: 'str9', prop: 'url', required: true, maxLen: 256 },
      { field: 'str1', prop: 'type', required: true },
      { field: 'str2', prop: 'size' }
    ]
  }

  /**
   * All Fields：
   * ipid - Article`s or file`s identity
   * title - Article`s title or file`s name.
   * hash - Article`s or file`s content Hash.
   * tags - Key words for description of article or file.
   * author - author`s name.
   * url - URI in the DDN P2P network
   * size - Article`s content length or file size
   * `timestamp` - timestamp from transaction.
   * type - Extension，e.g: dat://Daesgeadfedfa/first.html , extension is .html
   * @param {object} data Evidence data
   * @param {object} trs translation
   */
  async create (data, trs) {
    trs.recipientId = null
    trs.amount = '0' // bignum update

    // trs.asset.evidence = data.evidence;
    const assetJsonName = await this.getAssetJsonName(trs.type)
    trs.asset[assetJsonName] = data[assetJsonName]

    if (!trs.asset.evidence.description) {
      trs.asset.evidence.description = ''
    }

    console.log('evidence trs', trs)

    return trs
  }

  async getBytes (trs) {
    const asset = await this.getAssetObject(trs)

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

  async verify (trs, sender) {
    const trans = await super.verify(trs, sender)
    const assetObj = await this.getAssetObject(trs)

    const results = await super.queryAsset(
      {
        ipid: assetObj.ipid
      },
      ['ipid'],
      false,
      1,
      1
    )
    if (results && results.length > 0) {
      const oldEvidence = results[0]
      return await new Promise((resolve, reject) => {
        this.dao.findOneByPrimaryKey(
          'tr',
          oldEvidence.transaction_id,
          ['senderId'],
          async (err, { senderId }) => {
            if (err) {
              reject(err)
            } else {
              if (senderId !== sender.address) {
                return reject(
                                    `The evidence ipid ${assetObj.ipid} has been registered by ${senderId}`
                )
              } else {
                let results2
                try {
                  results2 = await super.queryAsset(
                    {
                      ipid: assetObj.ipid,
                      hash: assetObj.hash
                    },
                    ['ipid', 'hash'],
                    false,
                    1,
                    1
                  )
                } catch (err2) {
                  return reject(err2)
                }

                if (results2 && results2.length > 0) {
                  return reject(
                                        `The evidence hash already exists: ${assetObj.hash}`
                  )
                } else {
                  resolve(trans)
                }
              }
            }
          }
        )
      })
    } else {
      return trans
    }
  }

  async applyUnconfirmed (trs, sender, dbTrans) {
    const assetObj = await this.getAssetObject(trs)
    const key = `${sender.address}:${trs.type}:${assetObj.ipid}`
    if (this.oneoff.has(key)) {
      throw new Error(
                `The evidence ${assetObj.ipid} is in process already.`
      )
    }

    await super.applyUnconfirmed(trs, sender, dbTrans)

    this.oneoff.set(key, true)
  }

  async undoUnconfirmed (trs, sender, dbTrans) {
    const assetObj = await this.getAssetObject(trs)
    const key = `${sender.address}:${trs.type}:${assetObj.ipid}`
    this.oneoff.delete(key)

    const result = await super.undoUnconfirmed(trs, sender, dbTrans)
    return result
  }
}

export default Evidence
