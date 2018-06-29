/*---------------------------------------------------------------------------------------------
 *  Created by imfly on Mon Jun 18 2017 9:3:31
 *
 *  Copyright (c) 2017 DDN.link. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
const bignum = require('bignum-utils');

module.exports = {
  nethash: '2mn7qoar', //fl6ybowg mainnet 315by9uk
  maxAmount: bignum.multiply('100000000', '100').toString(), // 100亿
  fixedPoint : bignum.pow(10, 8),
  totalAmount: bignum.multiply('10000000000000000', '100').toString(), // 100亿
}