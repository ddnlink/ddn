import ByteBuffer from 'bytebuffer'

import Asset from '@ddn/asset-base'
import DdnUtils from '@ddn/utils'

/**
 * AoB 发行商
 * 一个用户仅能注册成为一个发行商
 */
class Issuer extends Asset.Base {
  // eslint-disable-next-line no-useless-constructor
  constructor (context, transactionConfig) {
    super(context, transactionConfig)
  }

  async propsMapping () {
    return [
      {
        field: 'str1',
        prop: 'name',
        required: true
      },
      {
        field: 'str2',
        prop: 'issuer_id'
      },
      {
        field: 'str10',
        prop: 'desc',
        minLen: 1,
        maxLen: 1024,
        required: true
      }
    ]
  }

  async getBytes (trs) {
    // const asset = await this.getAssetObject(trs)
    // // console.log('issuer.js getbytes asset:', asset)
    // const buffer = Buffer.concat([
    //   Buffer.from(asset.name, 'utf8'),
    //   Buffer.from(asset.desc || '', 'utf8')
    // ])

    // return buffer
    const issuer = await this.getAssetObject(trs)

    const bb = new ByteBuffer()
    bb.writeString(issuer.name)
    bb.writeString(issuer.desc)

    bb.flip()

    return bb.toBuffer()
  }

  async calculateFee () {
    return DdnUtils.bignum.multiply(100, this.constants.fixedPoint)
  }

  async verify (trs, sender) {
    // 先调用基类的验证
    const trans = await super.verify(trs, sender)

    const issuerObj = await this.getAssetObject(trs)

    // 验证是否存在重复数据
    const data1 = await this.queryAsset({
      name: issuerObj.name
    }, null, null, 1, 1)

    const data2 = await this.queryAsset({
      issuer_id: trs.senderId
    }, null, null, 1, 1)

    const results = data1.concat(data2)

    if (results && results.length > 0) {
      throw new Error('Issuer name/issuer_id already exists')
    } else {
      return trans
    }
  }

  async dbSave (trs, dbTrans) {
    const issuerObj = await this.getAssetObject(trs)
    issuerObj.issuer_id = trs.senderId
    await super.dbSave(trs, dbTrans)
  }

  /**
   * 自定义资产Api
   */
  async attachApi (router) {
    router.get('/', async (req, res) => {
      try {
        const result = await this.getList(req, res)
        res.json(result)
      } catch (err) {
        res.json({ success: false, error: err.message || err.toString() })
      }
    })
    router.get('/:name', async (req, res) => {
      try {
        const result = await this.getOneByName(req, res)
        res.json(result)
      } catch (err) {
        res.json({ success: false, error: err.message || err.toString() })
      }
    })
  }

  async getList (req) {
    // 确定页数相关
    const pageIndex = req.query.pageindex || 1
    const pageSize = req.query.pagesize || 50
    const result = await this.queryAsset(null, null, true, pageIndex, pageSize)

    return { success: true, result }
  }

  /**
   * 根据用户地址或发行商名称获取发行商记录
   * @param {*} req 请求对象，包含 `name` 字段，可以说 发行商名称，也可以是 `issuer_id`(其实就是注册发行商的地址公钥）
   */
  async getOneByName (req) {
    const name = req.params.name
    let where = { name }
    if (this.address.isAddress(name)) {
      where = { issuer_id: name }
    }

    const data = await this.queryAsset(where, null, null, 1, 1)
    return { success: true, result: data[0] }
  }

  async onBlockchainReady () {
    await new Promise((resolve, reject) => {
      this.dao.findList('mem_asset_balance', null, null, null,
        (err, rows) => {
          if (err) {
            return reject(err)
          }

          if (rows && rows.length) {
            for (var i = 0; i < rows.length; i++) {
              const row = rows[i]
              try {
                this.balanceCache.setAssetBalance(row.address, row.currency, row.balance)
              } catch (err2) {
                return reject(err2)
              }
            }
          }

          resolve()
        })
    })
  }
}

export default Issuer
