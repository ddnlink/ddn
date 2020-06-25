import Asset from '@ddn/asset-base'
import DdnUtils from '@ddn/utils'
import assert from 'assert'

class Aob extends Asset.Base {
  async propsMapping () {
    return [
      {
        field: 'str1',
        prop: 'name',
        required: true
      },
      {
        field: 'str9',
        prop: 'desc',
        minLen: 1,
        maxLen: 1024,
        required: true
      },
      {
        field: 'str2',
        prop: 'maximum'
      },
      {
        field: 'str3',
        prop: 'quantity'
      },
      {
        field: 'str4',
        prop: 'issuer_name'
      },
      {
        field: 'str10',
        prop: 'strategy'
      },
      {
        field: 'int1',
        prop: 'precision'
      },
      {
        field: 'int2',
        prop: 'acl'
      },
      {
        field: 'int3',
        prop: 'writeoff'
      },
      {
        field: 'str5',
        prop: 'allow_writeoff'
      },
      {
        field: 'str6',
        prop: 'allow_whitelist'
      },
      {
        field: 'str7',
        prop: 'allow_blacklist'
      }
    ]
  }

  async calculateFee () {
    return DdnUtils.bignum.multiply(500, this.constants.fixedPoint)
  }

  async verify (trs, sender) {
    await super.verify(trs, sender)

    const asset = await this.getAssetObject(trs)
    const nameParts = (asset.name || '').split('.')
    if (nameParts.length !== 2) {
      throw new Error('Invalid asset full name form asset-aob')
    }
    const issuerName = nameParts[0]
    const tokenName = nameParts[1]

    // token Name 3~6 个大写字母
    if (!tokenName || !/^[A-Z]{3,6}$/.test(tokenName)) {
      throw new Error('Invalid asset token name form asset-aob')
    }

    // 必须有描述
    if (!asset.desc) {
      throw new Error('Invalid asset desc form asset-aob')
    }

    if (asset.desc.length > 4096) {
      throw new Error('Invalid asset desc size form asset-aob')
    }

    // 精度在 0~16 位之间，通常 8 个精度就够用了
    if (asset.precision > 16 || asset.precision < 0) {
      throw new Error('Invalid asset precision form asset-aob')
    }

    // 最大值
    const error = DdnUtils.amount.validate(asset.maximum)
    if (error) {
      throw new Error(error)
    }

    // 策略不长于 256 字节
    if (asset.strategy && asset.strategy.length > 256) {
      throw new Error('Invalid asset strategy size form asset-aob')
    }

    // allow_writeoff, allow_whitelist, allow_blacklist 仅能是 '1'或'0'
    if (asset.allow_writeoff !== '0' && asset.allow_writeoff !== '1') {
      throw new Error('Asset allowWriteoff is not valid form asset-aob')
    }
    if (asset.allow_whitelist !== '0' && asset.allow_whitelist !== '1') {
      throw new Error('Asset allowWhitelist is not valid form asset-aob')
    }
    if (asset.allow_blacklist !== '0' && asset.allow_blacklist !== '1') {
      throw new Error('Asset allowBlacklist is not valid form asset-aob')
    }

    // Asset 唯一
    const assetData = await this.queryAsset({ name: asset.name }, null, false, 1, 1)
    if (assetData && assetData.length > 0) {
      throw new Error('asset->name Double register form asset-aob')
    }

    // issuer 注册商必须
    const issuerInst = await this.getAssetInstanceByName('AobIssuer')
    const issuerData = await issuerInst.queryAsset({ name: issuerName }, null, false, 1, 1)

    if (!issuerData || !(issuerData && issuerData.length > 0)) {
      throw new Error('Issuer not exists form asset-aob')
    }

    // 权限仅限于注册商
    if (issuerData[0].issuer_id !== sender.address) {
      throw new Error('Permission not allowed form asset-aob')
    }

    return trs
  }

  async getBytes (trs) {
    const asset = await this.getAssetObject(trs)
    let buffer = Buffer.concat([
      Buffer.from(asset.name, 'utf8'),
      Buffer.from(asset.desc, 'utf8'),
      Buffer.from(asset.maximum, 'utf8'),
      Buffer.from([asset.precision || 0]),
      Buffer.from(asset.strategy || '', 'utf8'),
      Buffer.from([asset.allow_writeoff || '0']),
      Buffer.from([asset.allow_whitelist || '0']),
      Buffer.from([asset.allow_blacklist || '0'])
    ])

    const { strategy } = asset
    if (strategy) {
      buffer = Buffer.concat([buffer])
    }
    return buffer
  }

  async dbSave (trs, dbTrans) {
    const asset = await this.getAssetObject(trs)
    const nameParts = asset.name.split('.')
    assert(nameParts.length === 2)
    asset.issuer_name = nameParts[0]
    asset.quantity = asset.quantity || '0'
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

    router.get('/:name/acl/:flag', async (req, res) => {
      try {
        const result = await this.getAssetAcl(req, res)
        res.json(result)
      } catch (err) {
        res.json({ success: false, error: err.message || err.toString() })
      }
    })

    router.get('/balances/:address', async (req, res) => { // 127.0.0.1:8001/api/aobasset/balances/:address
      try {
        const result = await this.getBalances(req, res)
        res.json(result)
      } catch (err) {
        res.json({ success: false, error: err.message || err.toString() })
      }
    })
    router.get('/balances/:address/:currency', async (req, res) => { // 127.0.0.1:8001/api/aobasset/balances/:address/:currency
      try {
        const result = await this.getBalance(req, res)
        res.json(result)
      } catch (err) {
        res.json({ success: false, error: err.message || err.toString() })
      }
    })
    router.get('/issuers/:name/assets', async (req, res) => {
      try {
        const result = await this.getIssuerAssets(req, res)
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
    const result = await super.queryAsset(null, null, true, pageIndex, pageSize)
    return { success: true, result }
  }

  async getOneByName (req) {
    const name = req.params.name
    const data = await this.queryAsset({ name }, null, false, 1, 1)
    return { success: true, result: data[0] }
  }

  async getAssetAcl (req) {
    const name = req.params.name
    const flag = req.params.flag
    const table = (flag === '0') ? 'acl_black' : 'acl_white'
    return new Promise((resolve, reject) => {
      var where = { currency: name }
      var limit = req.query.limit || 100
      var offset = req.query.offset || '0'
      this.dao.findPage(table, where, limit, offset, true, null, null, null, (err, data) => {
        if (err) {
          reject(err)
        }

        resolve({ success: true, result: data })
      })
    })
  }

  async getBalances (req) {
    const address = req.params.address
    return new Promise((resolve, reject) => {
      this.dao.findList('mem_asset_balance', { address }, null, null, null, (err, data) => {
        if (err) {
          reject(err)
        }

        resolve({ success: true, result: data })
      })
    })
  }

  async getBalance (req) {
    const address = req.params.address
    const currency = req.params.currency
    return new Promise((resolve, reject) => {
      this.dao.findOne('mem_asset_balance', { address, currency }, null, null, (err, data) => {
        if (err) {
          reject(err)
        }

        resolve({ success: true, result: data })
      })
    })
  }

  async getIssuerAssets (req) {
    const name = req.params.name
    const pageIndex = req.query.pageindex || 1
    const pageSize = req.query.pagesize || 50
    const data = await this.queryAsset({
      issuerName: name
    }, null, true, pageIndex, pageSize)

    return { success: true, result: data }
  }
}

export default Aob
