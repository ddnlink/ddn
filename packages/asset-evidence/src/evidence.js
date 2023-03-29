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
      { field: 'timestamp1', prop: 'time' }, // 时间
      { field: 'str_ext', prop: 'description', required: false } // 描述
    ]
  }

  async attachApi (router) {
    router.get('/short_hash/:short_hash', async (req, res) => {
      try {
        const result = await this.queryAsset({ short_hash: req.params.short_hash }, null, false, 1)
        res.json({ success: true, result: result[0] })
      } catch (err) {
        res.json({ success: false, error: err.message || err.toString() })
      }
    })
    router.get('/address/:address', async (req, res) => {
      try {
        const result = await this.queryAsset({ address: req.params.address }, null, false, 1)
        res.json({ success: true, result })
      } catch (err) {
        res.json({ success: false, error: err.message || err.toString() })
      }
    })
    // 根据type统计数据，根据时间过滤
    // req.params.startTime 开始时间
    // req.params.endTime 结束时间
    router.get('/type/statistics', async (req, res) => {
      try {
        let where = {}
        if (req.query.startTime) {
          where = { timestamp: { $gte: this.runtime.slot.getEpochTime(req.query.startTime) } }
        }
        if (req.query.endTime) {
          where = { timestamp: { $lte: this.runtime.slot.getEpochTime(req.query.endTime) } }
        }

        const result = await this.dao.findList('trs_asset', {
          where,
          attributes: ['str1', [this.dao.db_fn('count', this.dao.db_col('str1')), 'total']],
          group: 'str1'
        })
        res.json({ success: true, result })
      } catch (err) {
        res.json({ success: false, error: err.message || err.toString() })
      }
    })
    // 根据author统计数据，根据时间过滤
    // req.params.startTime 开始时间
    // req.params.endTime 结束时间
    router.get('/author/statistics', async (req, res) => {
      try {
        let where = {}
        if (req.query.startTime) {
          where = { timestamp: { $gte: this.runtime.slot.getEpochTime(req.query.startTime) } }
        }
        if (req.query.endTime) {
          where = { timestamp: { $lte: this.runtime.slot.getEpochTime(req.query.endTime), ...where.timestamp } }
        }
        const result = await this.dao.findList('trs_asset', {
          where,
          attributes: ['str3', [this.dao.db_fn('count', this.dao.db_col('str3')), 'total']],
          group: 'str3'
        })
        res.json({ success: true, result })
      } catch (err) {
        res.json({ success: false, error: err.message || err.toString() })
      }
    })
    // 根据short_hash查询数据
    // req.params.short_hash 是hash的截取，也可以存储其含义的数据
    // router.get('/short_hash/trace_source', async (req, res) => {
    //   try {
    //     const result = await this.dao.findList('trs_asset', { where: { str4: req.params.short_hash } })
    //     res.json({ success: true, result })
    //   } catch (err) {
    //     res.json({ success: false, error: err.message || err.toString() })
    //   }
    // })
    // 根据时间分组
    // req.params.startTime 开始时间
    // req.params.endTime 结束时间
    // req.params.type :可以根据year、month、day来统计
    router.get('/group/time', async (req, res) => {
      try {
        let result
        let where = {}
        if (req.query.startTime) {
          where = { timestamp: { $gte: this.runtime.slot.getEpochTime(req.query.startTime) } }
        }
        if (req.query.endTime) {
          where = { timestamp: { $lte: this.runtime.slot.getEpochTime(req.query.endTime), ...where.timestamp } }
        }
        const beginTime = Math.floor(this._context.constants.net.beginDate.getTime() / 1000)
        if (!req.query.type || req.query.type === 'year') {
          result = await this.dao.findList('trs_asset', {
            where,
            attributes: [
              [this.dao.db_str(`strftime("%Y",datetime(timestamp + ${beginTime}, 'unixepoch', 'localtime'))`), 'date'],
              [this.dao.db_str('COUNT(*)'), 'count']
            ],
            group: ['date']
          })
        } else if (req.query.type === 'month') {
          result = await this.dao.findList('trs_asset', {
            where,
            attributes: [
              [
                this.dao.db_str(`strftime("%Y,%m",datetime(timestamp + ${beginTime}, 'unixepoch', 'localtime')) `),
                'date'
              ],
              [this.dao.db_str('COUNT(*)'), 'count']
            ],
            group: ['date']
          })
        } else {
          result = await this.dao.findList('trs_asset', {
            where,
            attributes: [
              [
                this.dao.db_str(`strftime("%Y,%m,%d",datetime(timestamp + ${beginTime}, 'unixepoch', 'localtime'))`),
                'date'
              ],
              [this.dao.db_str('COUNT(*)'), 'count']
            ],
            group: ['date']
          })
        }
        res.json({ success: true, result })
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

  async objectNormalize (trs) {
    let assetObj = await this.getAssetObject(trs)
    // 验证为严格模式，通过推送过来的数据会通过protobuf加密，解密后数据是protobuf定义的数据类型中类的实例，实例有一些构造函数属性
    // 验证不会通过，所以需要把实例专为标准的json数据
    assetObj = Object.assign({}, assetObj)
    const validateErrors = await this.ddnSchema.validateEvidence(assetObj)
    if (validateErrors) {
      this.logger.error(
        `Failed to normalize Evidence: ${trs.type} ${validateErrors[0].schemaPath} ${validateErrors[0].message}`
      )
      this.logger.debug(`Failed to normalize Evidence asset: ${trs}`)
      throw new Error(`Failed to normalize Evidence: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`)
    }

    return trs
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
