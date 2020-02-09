/*---------------------------------------------------------------------------------------------
 *  Created by DDN Team on Wed Mar 14 2017 16:7:5
 *
 *  Copyright (c) 2019 DDN Foundation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

const Tmdb = require('./tmdb.js');
const { Bignum } = require('@ddn/utils');

class BalanceManager {
  constructor() {
    this.tmdb = new Tmdb
  }

  getNativeBalance(address) {
    return this.tmdb.get([address, 1])
  }

  setNativeBalance(address, balance) {
    // Bignum update
    // if (typeof balance === 'number') balance = String(balance)
    // this.tmdb.set([address, 1], Bignum(balance).toString())

    this.tmdb.set([address, 1], Bignum.new(balance).toString())
  }

  addNativeBalance(address, amount) {
    // Bignum update
    // if (typeof amount === 'number') amount = String(amount)

    const keys = [address, 1];
    const balance = this.tmdb.get(keys) || '0';

    // Bignum update
    // this.tmdb.set(keys, Bignum(balance).plus(amount).toString())
    this.tmdb.set(keys, Bignum.plus(balance, amount).toString());
  }

  getAssetBalance(address, currency) {
    return this.tmdb.get([address, currency])
  }

  setAssetBalance(address, currency, balance) {
    // Bignum update
    // if (typeof balance === 'number') amount = String(balance)
    // this.tmdb.set([address, currency], Bignum(balance).toString())

    this.tmdb.set([address, currency], Bignum.new(balance).toString());
  }

  addAssetBalance(address, currency, amount) {
    // Bignum update
    // if (typeof amount === 'number') amount = String(amount)

    const keys = [address, currency];
    const balance = this.tmdb.get(keys) || '0';

    // Bignum update
    // this.tmdb.set(keys, Bignum(balance).plus(amount).toString())
    this.tmdb.set(keys, Bignum.plus(balance, amount).toString());
  }

  rollback() {
    this.tmdb.rollback()
  }

  commit() {
    this.tmdb.commit()
  }
}

module.exports = BalanceManager
