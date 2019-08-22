/*---------------------------------------------------------------------------------------------
 *  Created by imfly on Wed Mar 14 2017 16:6:47
 *
 *  Copyright (c) 2017 DDN.link. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

const crypto = require('crypto');
const base58check = require('./base58check');
const constants = require('../constants');

module.exports = {
  isAddress(address) {
    if (typeof address !== 'string') {
      return false
    }
    if (/^[0-9]{1,20}$/g.test(address)) {
      return true
    }
    if (!base58check.decodeUnsafe(address.slice(1))) {
      return false
    }

    if ([constants.tokenPrefix].indexOf(address[0]) == -1) {
      return false
    }
    return true
  },

  generateBase58CheckAddress(publicKey) {
    if (typeof publicKey === 'string') {
      publicKey = Buffer.from(publicKey, 'hex')
    }
    const h1 = crypto.createHash('sha256').update(publicKey).digest();
    const h2 = crypto.createHash('ripemd160').update(h1).digest();
    return constants.tokenPrefix + base58check.encode(h2)
  },
}
