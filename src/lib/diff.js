/*---------------------------------------------------------------------------------------------
 *  Created by imfly on Wed Mar 14 2017 16:9:11
 *
 *  Copyright (c) 2017 DDN.link. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

module.exports = {
  reverse(diff) {
    const copyDiff = diff.slice();
    for (let i = 0; i < copyDiff.length; i++) {
      const math = copyDiff[i][0] == '-' ? '+' : '-';
      copyDiff[i] = math + copyDiff[i].slice(1);
    }
    return copyDiff;
  },

  merge(source, diff) {
    let res = source ? source.slice() : [];

    for (let i = 0; i < diff.length; i++) {
      const math = diff[i][0];
      const publicKey = diff[i].slice(1);

      if (math == "+") {
        res = res || [];

        var index = -1;
        if (res) {
          index = res.indexOf(publicKey);
        }
        if (index != -1) {
          return false;
        }

        res.push(publicKey);
      }
      if (math == "-") {
        var index = -1;
        if (res) {
          index = res.indexOf(publicKey);
        }
        if (index == -1) {
          return false;
        }
        res.splice(index, 1);
        if (!res.length) {
          res = null;
        }
      }
    }
    return res;
  }
}
