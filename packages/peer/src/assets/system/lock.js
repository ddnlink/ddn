/* ---------------------------------------------------------------------------------------------
 *  Created by DDN Team on Wed Mar 14 2017 16:3:33
 *
 *  Copyright (c) 2019 DDN Foundation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */
import DdnUtils from '@ddn/utils'

const { bignum } = DdnUtils

class Lock {
  constructor (context) {
    Object.assign(this, context)
    this._context = context
  }

  async create ({ args }, trs) {
    trs.args = args
    return trs
  }

  async calculateFee (trs, sender) {
    return this.constants[this.config.net].fees.send
  }

  async verify (trs, sender) {
    if (trs.args.length > 1) {
      throw new Error('Invalid args length')
    }
    if (trs.args[0].length > 50) {
      throw new Error('Invalid lock height')
    }

    // bignum update const lockHeight = Number(trs.args[0]);
    const lockHeight = trs.args[0]

    const lastBlock = this.runtime.block.getLastBlock()

    // bignum update if (isNaN(lockHeight) || lockHeight <= lastBlock.height)
    if (bignum.isNaN(lockHeight) || bignum.isLessThanOrEqualTo(lockHeight, lastBlock.height)) {
      throw new Error('Invalid lock height')
    }

    // bignum update if (sender.lockHeight && lastBlock.height + 1 <= sender.lockHeight)
    if (sender.lockHeight && bignum.isLessThanOrEqualTo(bignum.plus(lastBlock.height, 1), sender.lockHeight)) {
      throw new Error('Account is locked')
    }

    return trs
  }

  async process (trs, sender) {
    return trs
  }

  async getBytes (trs) {
    return null
  }

  async isSupportLock () {
    return false
  }

  async apply ({ args }, block, { address }, dbTrans) {
    await this.runtime.account.setAccount({
      address,
      lock_height: args[0] // bignum update Number(trs.args[0])
    }, dbTrans)

    // self.library.base.account.set(sender.address,
    // 	{
    // 		lock_height: trs.args[0]     //bignum update Number(trs.args[0])
    // 	}, dbTrans,
    // 	cb);
  }

  async undo (trs, block, { address }, dbTrans) {
    await this.runtime.account.setAccount({
      address,
      lock_height: 0
    }, dbTrans)

    // self.library.base.account.set(sender.address, { lock_height: 0 }, dbTrans, cb);
  }

  async applyUnconfirmed ({ type }, { address }, dbTrans) {
    const key = `${address}:${type}`
    if (this.oneoff.has(key)) {
      throw new Error('Double submit')
    }
    this.oneoff.set(key, true)

    // self.library.oneoff.set(key, true);
    // setImmediate(cb);
  }

  async undoUnconfirmed ({ type }, { address }, dbTrans) {
    const key = `${address}:${type}`
    this.oneoff.delete(key)
  }

  async objectNormalize (trs) {
    return trs
  }

  async dbRead (raw) {
    return null
  }

  async dbSave (trs, dbTrans) {
  }

  async ready ({ signatures }, { multisignatures, multimin }) {
    if (multisignatures.length) {
      if (!signatures) {
        return false
      }

      return signatures.length >= multimin - 1
    } else {
      return true
    }
  }
}

// Export
export default Lock
