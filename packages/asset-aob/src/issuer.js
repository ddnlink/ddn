import Asset from '@ddn/asset-base'
import DdnUtils from '@ddn/utils'

/**
 * AoB 发行商
 * 一个用户仅能注册成为一个发行商
 */
class Issuer extends Asset.Base {
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
        // console.log('name.....', result);

        res.json(result)
      } catch (err) {
        res.json({ success: false, error: err.message || err.toString() })
      }
    })
  }

  // FIXME: 2020.5.30 下面的方法没有被调用！！
  async getList (req) {
    // 确定页数相关
    const pageIndex = req.query.pageindex || 1
    const pageSize = req.query.pagesize || 50
    const result = await this.queryAsset(null, null, true, pageIndex, pageSize)
    // console.log('getList result', result);

    return { success: true, result }
  }

  async getOneByName (req) {
    const name = req.params.name
    const data = await this.queryAsset({ name }, null, false, 1, 1)
    console.log('getOneByName data', data)

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
