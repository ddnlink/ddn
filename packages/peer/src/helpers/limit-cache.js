/* ---------------------------------------------------------------------------------------------
 *  Created by imfly on Wed Mar 14 2017 16:9:36
 *
 *  Copyright (c) 2017 DDN.link. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

const DEFAULT_LIMIT = 10000
class LimitCache {
  constructor (options) {
    if (!options) options = {}
    this.limit = options.limit || DEFAULT_LIMIT
    this.index = []
    this.cache = new Map()
  }

  set (key, value) {
    if (this.cache.size >= this.limit && !this.cache.has(key)) {
      const dropKey = this.index.shift()
      this.cache.delete(dropKey)
    }
    this.cache.set(key, value)
    this.index.push(key)
  }

  has (key) {
    return this.cache.has(key)
  }
}

export default LimitCache
