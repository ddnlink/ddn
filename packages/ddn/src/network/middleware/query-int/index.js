/*---------------------------------------------------------------------------------------------
 *  Created by imfly on Wed Mar 14 2017 16:33:42
 *
 *  Copyright (c) 2017 DDN.link. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

const parseNums = require('./parse');

module.exports = options => {
  options = options || {
    parser: parseInt
  };

  return (req, res, next) => {
    req.query = parseNums(req.query, options);
    next();
  };
};
