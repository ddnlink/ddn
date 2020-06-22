/* ---------------------------------------------------------------------------------------------
 *  Created by imfly on Mon Jun 18 2017 9:3:31
 *
 *  Copyright (c) 2017 DDN FOUNDATION. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */
import DdnUtils from '@ddn/utils'

export default {
  nethash: 'fl6ybowg', // 亿书 mainnet： fl6ybowg； mainnet 315by9uk 2mn7qoar
  maxAmount: DdnUtils.bignum.multiply('100000000', '100').toString(), // 100亿
  fixedPoint: DdnUtils.bignum.pow(10, 8),
  totalAmount: DdnUtils.bignum.multiply('10000000000000000', '100').toString() // 100亿
}
