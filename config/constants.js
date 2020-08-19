/* ---------------------------------------------------------------------------------------------
 *  Created by DDN Team on Sat Jun 16 2017 11:31:12
 *
 *  Copyright (c) 2019 DDN Foundation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

import ddn from './constants.ddn'

let constants = ddn

// Todo: get it when building
if (process.env.DDN_ENV === 'custom') {
  constants = require('./constants.custom').default
}

export default constants
