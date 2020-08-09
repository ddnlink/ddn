/* ---------------------------------------------------------------------------------------------
 *  Created by DDN Team on Wed Mar 14 2017 16:7:5
 *
 *  Copyright (c) 2019 DDN Foundation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

import { bignum } from '@ddn/utils'
import Tmdb from './tmdb.js'

class BalanceManager {
  constructor () {
    this.tmdb = new Tmdb()
  }

  getNativeBalance (address) {
    return this.tmdb.get([address, 1])
  }

  setNativeBalance (address, balance) {
    this.tmdb.set([address, 1], bignum.new(balance).toString())
  }

  addNativeBalance (address, amount) {
    // bignum update
    // if (typeof amount === 'number') amount = String(amount)

    const keys = [address, 1]
    const balance = this.tmdb.get(keys) || '0'

    this.tmdb.set(keys, bignum.plus(balance, amount).toString())
  }

  getAssetBalance (address, currency) {
    return this.tmdb.get([address, currency])
  }

  setAssetBalance (address, currency, balance) {
    // bignum update
    // if (typeof balance === 'number') amount = String(balance)
    // this.tmdb.set([address, currency], bignum(balance).toString())

    this.tmdb.set([address, currency], bignum.new(balance).toString())
  }

  addAssetBalance (address, currency, amount) {
    // bignum update
    // if (typeof amount === 'number') amount = String(amount)

    const keys = [address, currency]
    const balance = this.tmdb.get(keys) || '0'

    // bignum update
    this.tmdb.set(keys, bignum.plus(balance, amount).toString())
  }

  rollback () {
    this.tmdb.rollback()
  }

  commit () {
    this.tmdb.commit()
  }
}

export default BalanceManager
