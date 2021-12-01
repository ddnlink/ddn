import Asset from '@ddn/asset-base'
import DdnUtils from '@ddn/utils'

class Evidence extends Asset.Base {
  // eslint-disable-next-line no-useless-constructor
  constructor (context, transactionConfig) {
    super(context, transactionConfig)
  }

  async propsMapping () {
    return [
      { field: 'str4', prop: 'short_hash', maxLen: 64 }, // 短hash，截取原始hash的一部分的值
      { field: 'str6', prop: 'title', maxLen: 128 }, // 该数据的标题
      { field: 'str8', prop: 'address', required: true }, // 地址
      { field: 'str7', prop: 'hash', required: true, maxLen: 128 },
      { field: 'str5', prop: 'tags' }, // 存证数据的标签
      { field: 'str3', prop: 'author', required: true, maxLen: 20 }, // 该存证数据的使用者，或者是所有人
      { field: 'str9', prop: 'source_address', maxLen: 256 }, // 存证数据的原始地址，有可以填，没有为空
      { field: 'str1', prop: 'type', required: true }, // 存证的数据类型（video、image、videostram、voice）
      { field: 'str2', prop: 'size' }, // string length:64
      { field: 'str10', prop: 'metadata' }, // 元数据 ，上面这些字段如果不能够满足存储的条件，其它数据可以序列化一下存到这里，该字段不能检索
      { field: 'str_ext', prop: 'time' }, // 时间
      { field: 'str_ext', prop: 'description', required: false } // 描述
    ]
  }

  async attachApi (router) {
    router.get('/short_hash/:short_hash', async (req, res) => {
      try {
        const result = await this.queryAsset({ short_hash: req.params.short_hash }, null, false, 1)
        res.json(result[0])
      } catch (err) {
        res.json({ success: false, error: err.message || err.toString() })
      }
    })
    router.get('/address/:address', async (req, res) => {
      try {
        const result = await this.queryAsset({ address: req.params.address }, null, false, 1)
        res.json(result)
      } catch (err) {
        res.json({ success: false, error: err.message || err.toString() })
      }
    })
  }
  /**
   * All Fields：
   * short_hash - 截取hash的一部分，在链上也是唯一的
   * title - 存证的标题.
   * hash - 数据的hash.
   * tags - 存证的标签.
   * author - 存证人，或者存证的所有者.
   * source_address -原始数据的地址，对应存证人存证数据的原始地址
   * size - 存证数据的大小
   * `timestamp` - 时间戳
   * type - 存证的数据类型
   * time - 需要存证的时间
   * metadata - 元数据，上面这些字段如果不能够满足存储的条件，其它数据可以序列化一下存到这里，该字段不能检索
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

    return trs
  }

  // async getBytes(trs) {
  //   const asset = await this.getAssetObject(trs)

  //   const bb = new ByteBuffer(1, true)
  //   bb.writeString(asset.ipid)
  //   bb.writeString(asset.title)
  //   bb.writeString(asset.tags)
  //   bb.writeString(asset.author)
  //   bb.writeString(asset.url)
  //   bb.writeString(asset.size)
  //   bb.writeString(asset.type) // eg: .html, .doc
  //   bb.writeString(asset.hash)
  //   bb.flip()

  //   return bb.toBuffer()
  // }

  async calculateFee () {
    return DdnUtils.bignum.multiply(this.constants.net.fees.evidence, this.constants.fixedPoint)
  }

  async verify (trs, sender) {
    const trans = await super.verify(trs, sender)
    const assetObj = await this.getAssetObject(trs)

    const results = await super.queryAsset(
      {
        short_hash: assetObj.short_hash
      },
      ['short_hash'],
      false,
      1,
      1
    )
    if (!results || !results.length) {
      return trans
    }
    const oldEvidence = results[0]
    const { senderId } = await this.dao.findOneByPrimaryKey('tr', oldEvidence.transaction_id, { attributes: ['senderId'] })

    if (senderId !== sender.address) {
      throw new Error(`The evidence short_hash ${assetObj.short_hash} has been registered by ${senderId})`)
    }

    const results2 = await super.queryAsset(
      {
        short_hash: assetObj.short_hash,
        hash: assetObj.hash
      },
      ['short_hash', 'hash'],
      false,
      1,
      1
    )

    if (results2 && results2.length > 0) {
      throw new Error(`The evidence hash already exists: ${assetObj.hash}`)
    } else {
      return trans
    }
  }

  async applyUnconfirmed (trs, sender, dbTrans) {
    const assetObj = await this.getAssetObject(trs)
    const key = `${sender.address}:${trs.type}:${assetObj.short_hash}`
    if (this.oneoff.has(key)) {
      throw new Error(`The evidence ${assetObj.short_hash} is in process already.`)
    }

    await super.applyUnconfirmed(trs, sender, dbTrans)

    this.oneoff.set(key, true)
  }

  async undoUnconfirmed (trs, sender, dbTrans) {
    const assetObj = await this.getAssetObject(trs)
    const key = `${sender.address}:${trs.type}:${assetObj.short_hash}`
    this.oneoff.delete(key)

    const result = await super.undoUnconfirmed(trs, sender, dbTrans)
    return result
  }
}

export default Evidence
