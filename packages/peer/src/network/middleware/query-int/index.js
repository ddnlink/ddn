/* ---------------------------------------------------------------------------------------------
 *  Created by DDN Team on Wed Mar 14 2017 16:33:42
 *
 *  Copyright (c) 2019 DDN Foundation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

import parseNums from './parse'

export default (
  options = {
    parser: parseInt
  }
) => {
  return (req, res, next) => {
    req.query = parseNums(req.query, options)
    next()
  }
}
