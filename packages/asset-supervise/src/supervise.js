import ByteBuffer from 'bytebuffer'
import Asset from '@ddn/asset-base'
import DdnUtils from '@ddn/utils'
class Supervise extends Asset.Base {
  // eslint-disable-next-line no-useless-constructor
  constructor (context, transactionConfig) {
    super(context, transactionConfig)
  }

  async calculateFee () {
    return DdnUtils.bignum.multiply(0.1, this.constants.fixedPoint)
  }

  async propsMapping () {
    return [
      { field: 'str4', prop: 'txHash', required: true, maxLen: 128 },
      { field: 'str1', prop: 'op', required: true, maxLen: 32 }
      // { field: 'str4', prop: 'senderId', required: true, maxLen: 128 },
    ]
  }

  async getBytes (trs) {
    const asset = await this.getAssetObject(trs)
    const bb = new ByteBuffer(1, true)
    bb.writeString(asset.txHash)
    bb.writeString(asset.op)
    // bb.writeString(asset.senderId)
    bb.flip()
    return bb.toBuffer()
  }

  async verify (trs, sender) {
    const trans = await super.verify(trs, sender)
    const assetObj = await this.getAssetObject(trs)
    if (DdnUtils.bignum.isGreaterThanOrEqualTo(sender.balance, '900000000000000000')) {
      let result
      try {
        await this.findOneSupervise(assetObj)
      } catch (error) {
        console.log('errr', error)
      }
      if (result) {
        throw new Error('the supervise is exist!')
      }
    }
    return trans
  }

  async applyUnconfirmed (trs, sender, dbTrans) {
    const assetObj = await this.getAssetObject(trs)
    const key = `${sender.address}:${trs.type}:${assetObj.txHash}:${assetObj.op}`
    if (this.oneoff.has(key)) {
      throw new Error(`The Supervise ${assetObj.txHash} is in process already.`)
    }
    await super.applyUnconfirmed(trs, sender, dbTrans)
    this.oneoff.set(key, true)
  }

  async undoUnconfirmed (trs, sender, dbTrans) {
    const assetObj = await this.getAssetObject(trs)
    const key = `${sender.address}:${trs.type}:${assetObj.txHash}:${assetObj.op}`
    this.oneoff.delete(key)
    const result = await super.undoUnconfirmed(trs, sender, dbTrans)
    return result
  }

  async undo (trs, sender, dbTrans) {
    await this.destroySupervise(trs.id, dbTrans)
    const result = await super.undoUnconfirmed(trs, sender, dbTrans)
    return result
  }

  async dbSave (trs, dbTrans) {
    const superviseObj = await this.getAssetObject(trs)
    superviseObj.senderId = trs.senderId
    superviseObj.transaction_id = trs.id
    await this.saveSupervise(superviseObj, dbTrans)
    await super.dbSave(trs, dbTrans)
  }

  async saveSupervise (superviseObj, dbTrans) {
    console.log('dbsave', superviseObj)
    // return new Promise((resolve, reject) => {
    //   this._context.dao.insertOrUpdate('supervise', superviseObj, dbTrans, (err, result) => {
    //     if (err) {
    //       return reject(new Error(`insertOrUpdate supervise ${err}`))
    //     }

    //     resolve(result)
    //   })
    // })
    const data = await this.findOneSupervise({ txHash: superviseObj.txHash }, dbTrans)
    if (data) {
      return this.updateSupervise({ op: superviseObj.op }, { txHash: superviseObj.txHash }, dbTrans)
    } else {
      return new Promise((resolve, reject) => {
        this._context.dao.insertOrUpdate('supervise', superviseObj, dbTrans, (err, result) => {
          if (err) {
            return reject(new Error(`insertOrUpdate supervise ${err}`))
          }

          resolve(result)
        })
      })
    }
  }

  async findOneSupervise (superviseObj, dbTrans) {
    return new Promise((resolve, reject) => {
      this.dao.findOne('supervise', {
        ...superviseObj
      }, null, dbTrans, (err, rows) => {
        if (err) {
          reject(err)
        } else {
          resolve(rows)
        }
      })
    })
  }

  async destroySupervise (transaction_id, dbTrans) {
    return new Promise((resolve, reject) => {
      this.dao.remove('supervise', {
        transaction_id
      }, null, dbTrans, (err, rows) => {
        if (err) {
          reject(err)
        } else {
          resolve(rows)
        }
      })
    })
  }

  async updateSupervise (superviseObj, where, dbTrans) {
    return new Promise((resolve, reject) => {
      this.dao.update('supervise', superviseObj, where, dbTrans, (err, rows) => {
        if (err) {
          reject(err)
        } else {
          resolve(rows)
        }
      })
    })
  }
}

export default Supervise
