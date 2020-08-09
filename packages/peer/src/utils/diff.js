/* ---------------------------------------------------------------------------------------------
 *  Created by DDN Team on Wed Mar 14 2017 16:9:11
 *
 *  Copyright (c) 2019 DDN Foundation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

export default {

  /**
   * 充值变更操作
   * @param {array} diff 变更内容的数组，格式为 ['+publicKey1', '-publicKey2'] 比如：['+aswbs...sfefs', '-sfsfesbfee...fegf']
   */
  reverse (diff) {
    const copyDiff = diff.slice()
    for (let i = 0; i < copyDiff.length; i++) {
      const math = copyDiff[i][0] === '-' ? '+' : '-'
      copyDiff[i] = math + copyDiff[i].slice(1)
    }
    return copyDiff
  },

  /**
   * 合并
   * @param {array} source 源数组
   * @param {array} diff 变更列表
   */
  merge (source, diff) {
    let res = source ? source.slice() : []

    for (let i = 0; i < diff.length; i++) {
      const math = diff[i][0]
      const publicKey = diff[i].slice(1)

      if (math === '+') {
        res = res || []

        let index = -1
        if (res) {
          index = res.indexOf(publicKey)
        }
        if (index !== -1) {
          return false
        }

        res.push(publicKey)
      }

      if (math === '-') {
        let index = -1
        if (res) {
          index = res.indexOf(publicKey)
        }
        if (index === -1) {
          return false
        }
        res.splice(index, 1)
        if (!res.length) {
          res = null
        }
      }
    }
    return res
  }
}
