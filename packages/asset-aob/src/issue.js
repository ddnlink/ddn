import _ from 'lodash'
import mathjs from 'mathjs'

import Asset from '@ddn/asset-base'
import DdnJS, { bignum } from '@ddn/utils'

class Issue extends Asset.Base {
  // eslint-disable-next-line no-useless-constructor
  constructor (context, transactionConfig) {
    super(context, transactionConfig)
  }

  async propsMapping () {
    return [
      {
        field: 'str1',
        prop: 'currency',
        required: true
      },
      {
        field: 'str2',
        prop: 'amount'
      }
    ]
  }

  async getBytes (trs) {
    const asset = await this.getAssetObject(trs)

    const buffer = Buffer.concat([Buffer.from(asset.currency, 'utf8'), Buffer.from(asset.amount, 'utf8')])

    return buffer
  }

  async calculateFee () {
    return bignum.multiply(this.constants.net.fees.aob_issue, this.constants.fixedPoint)
  }

  async verify (trs, sender) {
    const assetIssue = await this.getAssetObject(trs)

    // 检查参数
    if (trs.recipientId) {
      throw new Error('Invalid AoB Issue transaction recipient')
    }

    // 主交易数量应该为 0
    if (!bignum.isZero(trs.amount)) {
      throw new Error('Invalid AoB Issue transaction amount')
    }

    const { amount } = assetIssue
    const error = DdnJS.amount.validate(amount)
    if (error) {
      throw new Error(`Invalid AoB Issue transaction amount: ${error}`)
    }

    // (1)得到资产数据
    // (1)查询到asset的数据列表
    // let result
    const assetInst = await this.getAssetInstanceByName('AobAsset')

    const name = assetIssue.currency
    const result = await assetInst.queryAsset({ name }, null, false, 1, 1)

    // (2)查询到issuer的数据列表
    const issuerInst = await this.getAssetInstanceByName('AobIssuer')
    let issuerData = await issuerInst.queryAsset(
      {
        name: { $in: _.map(result, 'issuer_name') }
      },
      null,
      false,
      1,
      1000
    )

    issuerData = _.keyBy(issuerData, 'name')

    const result2 = _.map(result, num => {
      const num2 = num
      num2.issuer_id = issuerData[num.issuer_name].issuer_id
      return num2
    })

    // (3)查询到交易的相关数据
    let trData = await this.dao.findList('tr', {
      where: {
        id: {
          $in: _.map(result, 'transaction_id')
        }
      }
    })
    trData = _.keyBy(trData, 'id')

    const result3 = _.map(result2, num => {
      const num2 = num
      num2.block_id = trData[num.transaction_id].block_id
      return num2
    })

    // (4)查询到块的相关数据
    let blockData = await this.dao.findList('block', {
      where: {
        id: {
          $in: _.map(result3, 'block_id') // result - result3
        }
      }
    })
    blockData = _.keyBy(blockData, 'id')

    const result4 = _.map(result3, num => {
      const num2 = num
      num2.height = blockData[num.block_id].height
      return num2
    })

    // 循环整合验证数据
    for (let i = 0; i < result4.length; i += 1) {
      const { precision } = result4[i]
      result4[i].maximum = bignum.new(result4[i].maximum).toString(10)
      result4[i].maximumShow = DdnJS.amount.calcRealAmount(result4[i].maximum, precision)
      result4[i].quantity = bignum.new(result4[i].quantity).toString(10)
      result4[i].quantityShow = DdnJS.amount.calcRealAmount(result4[i].quantity, precision)
    }
    const count = 0

    const result5 = result4[count]
    if (!result5) {
      throw new Error('Asset not exists --- from asset-aob -> issue.verify')
    }

    if (result5.issuer_id !== sender.address) {
      throw new Error('Permission not allowed --- from asset-aob -> issue.verify')
    }
    if (result5.writeoff) {
      throw new Error('Asset already writeoff --- from asset-aob -> issue.verify')
    }
    const { maximum } = result5
    const { quantity } = result5
    const { precision } = result5
    if (bignum.isGreaterThan(bignum.plus(quantity, amount), maximum)) {
      throw new Error('Exceed issue limit --- from asset-aob -> issue.verify')
    }
    const { strategy } = result5
    const genesisHeight = result5.height
    const height = bignum.plus(this.runtime.block.getLastBlock().height, 1)
    if (strategy) {
      const context = {
        maximum: bignum.new(maximum), // mathjs.bignumber(maximum),
        precision,
        quantity: bignum.plus(quantity, amount),
        genesisHeight: bignum.new(genesisHeight), // bignum update
        height: bignum.new(height) // bignum update
      }
      const evalRet = mathjs.eval(strategy, context)
      if (!evalRet) {
        throw new Error('Strategy not allowed --- from asset-aob -> issue.verify')
      }
    }
    return null
  }

  async apply (trs, block, sender, dbTrans) {
    const assetIssue = await this.getAssetObject(trs)
    const { currency, amount } = assetIssue
    this.balanceCache.addAssetBalance(sender.address, currency, amount)
    const assetInst = await this.getAssetInstanceByName('AobAsset')
    const data = await assetInst.queryAsset(
      {
        name: currency
      },
      null,
      null,
      1,
      1
    )
    const { quantity } = data[0]
    await assetInst.update({ quantity: bignum.plus(quantity, amount).toString() }, { name: currency }, dbTrans)
    const assetBalancedata = await this.dao.findOne('mem_asset_balance', { where: { address: sender.address, currency } })

    const balance = assetBalancedata && assetBalancedata.balance ? assetBalancedata.balance : '0'
    const newBalance = bignum.plus(balance, amount)
    if (bignum.isLessThan(newBalance, 0)) {
      throw new Error('Asset balance not enough')
    }
    if (assetBalancedata) {
      await this.dao.update(
        'mem_asset_balance',
        { balance: newBalance.toString() },
        {
          where: { address: sender.address, currency },
          transaction: dbTrans
        }
      )
    } else {
      await this.dao.insert(
        'mem_asset_balance',
        { address: sender.address, currency, balance: newBalance.toString() },
        { transaction: dbTrans }
      )
    }
    return trs
  }

  async undo (trs, block, sender, dbTrans) {
    const assetIssue = await this.getAssetObject(trs)
    const { currency, amount } = assetIssue
    const balance = this.balanceCache.getAssetBalance(sender.address, currency) || 0
    if (bignum.isLessThan(balance, amount)) {
      throw new Error(`Invalid asset balance: ${balance}`)
    }
    this.balanceCache.addAssetBalance(sender.address, currency, `-${amount}`)
    const assetInst = await this.getAssetInstanceByName('AobAsset')
    const data = await assetInst.queryAsset(
      {
        name: currency
      },
      null,
      null,
      1,
      1
    )
    const { quantity } = data[0]
    await assetInst.update({ quantity: bignum.plus(quantity, amount).toString() }, { name: currency }, dbTrans)
    const assetBalancedata = await this.dao.findOne('mem_asset_balance', {
      where: { address: sender.address, currency },
      attributes: ['balance']
    })

    const balance2 = assetBalancedata && assetBalancedata.balance ? assetBalancedata.balance : '0'
    const newBalance = bignum.plus(balance2, amount)
    if (bignum.isLessThan(newBalance, 0)) {
      throw new Error('Asset balance not enough')
    }
    if (assetBalancedata) {
      await this.dao.update(
        'mem_asset_balance',
        {
          balance: newBalance.toString()
        },
        {
          where: { address: sender.address, currency },
          transaction: dbTrans
        }
      )
    } else {
      await this.dao.insert(
        'mem_asset_balance',
        { address: sender.address, currency, balance: newBalance.toString() },
        { transaction: dbTrans }
      )
    }
  }
}

export default Issue
