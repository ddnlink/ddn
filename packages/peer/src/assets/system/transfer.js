/**
 * 转账资产交易
 * wangxm   2018-12-28
 */
import DdnUtil from '@ddn/utils' // DdnUtil.bignum update

class Transfer {
  constructor (context) {
    Object.assign(this, context)
    this._context = context
  }

  async create ({
    recipientId,
    amount
  }, trs) {
    trs.recipientId = recipientId // wxm block database
    trs.amount = `${amount}`

    return trs
  }

  async calculateFee (trs, sender) {
    return this.constants[this.config.net].fees.send
  }

  async verify (trs, {
    address,
    lockHeight
  }) {
    if (!this.address.isAddress(trs.recipientId)) {
      throw new Error('Invalid recipient')
    }

    if (DdnUtil.bignum.isNaN(trs.amount)) {
      throw new Error('Invalid transaction amount.')
    }

    if (DdnUtil.bignum.isLessThanOrEqualTo(trs.amount, 0)) {
      throw new Error('Invalid transaction amount')
    }

    if (trs.recipientId === address) {
      // wxm block database
      throw new Error('Invalid recipientId, cannot be your self')
    }

    if (!this.config.settings.enableMoreLockTypes) {
      const lastBlock = this.runtime.block.getLastBlock()

      if (
        lockHeight &&
                lastBlock &&
                DdnUtil.bignum.isLessThanOrEqualTo(
                  DdnUtil.bignum.plus(lastBlock.height, 1),
                  lockHeight
                )
      ) {
        throw new Error('Account is locked')
      }
    }

    return trs
  }

  async process (trs, sender) {
    // setImmediate(cb, null, trs);
    return trs
  }

  async getBytes (trs) {
    return null
  }

  async isSupportLock () {
    return true
  }

  async apply ({
    recipientId,
    amount
  }, {
    id,
    height
  }, sender, dbTrans) {
    await this.runtime.account.setAccount({
      address: recipientId
    },
    dbTrans
    )

    await this.runtime.account.merge(
      recipientId, {
        address: recipientId, // wxm block database
        balance: amount,
        u_balance: amount,
        block_id: id, // wxm block database
        round: await this.runtime.round.calc(height)
      },
      dbTrans
    )
  }

  async undo ({
    recipientId,
    amount
  }, {
    id,
    height
  }, sender, dbTrans) {
    await this.runtime.account.setAccount({
      address: recipientId
    },
    dbTrans
    )

    await this.runtime.account.merge(
      recipientId, {
        address: recipientId, // wxm block database
        balance: `-${amount}`,
        u_balance: `-${amount}`,
        block_id: id, // wxm block database
        round: await this.runtime.round.calc(height)
      },
      dbTrans
    )
  }

  async applyUnconfirmed (trs, sender, dbTrans) {

  }

  async undoUnconfirmed (trs, sender, dbTrans) {

  }

  async objectNormalize (trs) {
    delete trs.block_id // wxm block database
    return trs
  }

  async dbRead (raw) {
    return null
  }

  async dbSave (trs, dbTrans) {}

  async ready ({
    signatures
  }, {
    multisignatures,
    multimin
  }) {
    if (Array.isArray(multisignatures) && multisignatures.length) {
      if (!signatures) {
        return false
      }
      return signatures.length >= multimin - 1
    } else {
      return true
    }
  }
}

export default Transfer
