/* ---------------------------------------------------------------------------------------------
 *  Created by DDN Team on Wed Mar 14 2017 16:33:51
 *
 *  Copyright (c) 2019 DDN Foundation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

/**
 * Attempts to convert object properties recursively to numbers.
 * @param  {Object}    obj             - Object to iterate over.
 * @param  {Object}    options         - Options.
 * @param  {Function}  options.parser  - Parser to process string with. Should return NaN if not a valid number. Defaults to parseInt.
 * @return {Object}    Returns new object with same properties (shallow copy).
*/
function parseNums (obj, options) {
  const result = {}
  let key
  let value

  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      value = obj[key]

      if (typeof value === 'string' && !isNaN(options.parser.call(null, value, 10, key))) {
        result[key] = options.parser.call(null, value, 10, key)
      } else if (value.constructor === Object) {
        result[key] = parseNums(value, options)
      } else {
        result[key] = value
      }
    }
  }

  return result
}

export default parseNums
