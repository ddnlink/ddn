/* ---------------------------------------------------------------------------------------------
 *  Created by DDN Team on Wed Mar 14 2017 16:7:5
 *
 *  Copyright (c) 2019 DDN Foundation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

import Tmdb from './tmdb.js'

import DdnUtil from '@ddn/utils'

class BalanceManager {
  constructor () {
    this.tmdb = new Tmdb()
  }

  getNativeBalance (address) {
    return this.tmdb.get([address, 1])
  }

  setNativeBalance (address, balance) {
    // DdnUtil.bignum update
    // if (typeof balance === 'number') balance = String(balance)
    // this.tmdb.set([address, 1], DdnUtil.bignum(balance).toString())

    this.tmdb.set([address, 1], DdnUtil.bignum.new(balance).toString())
  }

  addNativeBalance (address, amount) {
    // DdnUtil.bignum update
    // if (typeof amount === 'number') amount = String(amount)

    const keys = [address, 1]
    const balance = this.tmdb.get(keys) || '0'

    // DdnUtil.bignum update
    // this.tmdb.set(keys, DdnUtil.bignum(balance).plus(amount).toString())
    this.tmdb.set(keys, DdnUtil.bignum.plus(balance, amount).toString())
  }

  getAssetBalance (address, currency) {
    return this.tmdb.get([address, currency])
  }

  setAssetBalance (address, currency, balance) {
    // DdnUtil.bignum update
    // if (typeof balance === 'number') amount = String(balance)
    // this.tmdb.set([address, currency], DdnUtil.bignum(balance).toString())

    this.tmdb.set([address, currency], DdnUtil.bignum.new(balance).toString())
  }

  addAssetBalance (address, currency, amount) {
    // DdnUtil.bignum update
    // if (typeof amount === 'number') amount = String(amount)

    const keys = [address, currency]
    const balance = this.tmdb.get(keys) || '0'

    // DdnUtil.bignum update
    // this.tmdb.set(keys, DdnUtil.bignum(balance).plus(amount).toString())
    this.tmdb.set(keys, DdnUtil.bignum.plus(balance, amount).toString())
  }

  rollback () {
    this.tmdb.rollback()
  }

  commit () {
    this.tmdb.commit()
  }
}

export default BalanceManager
