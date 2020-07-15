/* ---------------------------------------------------------------------------------------------
 *  Created by DDN Team on Sat Jun 16 2017 11:31:12
 *
 *  Copyright (c) 2019 DDN Foundation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

import constants from './constants.ddn'
import options from '../options'

constants.net = constants[options.get('net')]

export default constants
