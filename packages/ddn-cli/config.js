/*---------------------------------------------------------------------------------------------
 *  Created by imfly on Mon Jun 18 2017 9:3:31
 *
 *  Copyright (c) 2017 DDN.link. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
const { Bignum } = require('@ddn/ddn-utils');

module.exports = {
  nethash: 'fl6ybowg', //fl6ybowg mainnet 315by9uk 2mn7qoar
  maxAmount: Bignum.multiply('100000000', '100').toString(), // 100亿
  fixedPoint : Bignum.pow(10, 8),
  totalAmount: Bignum.multiply('10000000000000000', '100').toString(), // 100亿
}