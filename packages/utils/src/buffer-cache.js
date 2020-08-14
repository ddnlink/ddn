/* ---------------------------------------------------------------------------------------------
 *  Created by DDN Team on Wed Mar 14 2017 16:7:35
 *
 *  Copyright (c) 2019 DDN Foundation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

const TEN_MINUTES = 1000 * 60 * 10
const FOUR_HOURS = 1000 * 60 * 60 * 4
const DEFAULT_MAX_CACHE_NUMBER = 100000

class BufferCache {
  constructor ({ maxCacheNumber, refreshInterval, clearInterval }) {
    this.maxCacheNumber = maxCacheNumber || DEFAULT_MAX_CACHE_NUMBER
    this.refreshInterval = refreshInterval || TEN_MINUTES
    this.clearInterval = clearInterval || FOUR_HOURS
    this.buffer = new Map()
    this.history = new Map()
    this.lastRefreshTime = Date.now()
    this.lastClearTime = Date.now()
  }

  set (key, value) {
    if (this.buffer.size + this.history.size >= this.maxCacheNumber && !this.has(key)) {
      throw new Error('Cache limit exceeded')
    }
    this.buffer.set(key, value)
    this.refresh_()
  }

  has (key) {
    return this.buffer.has(key) || this.history.has(key)
  }

  remove (key) {
    this.buffer.delete(key)
    this.history.delete(key)
  }

  refresh_ () {
    const elapsed1 = Date.now() - this.lastRefreshTime
    const elapsed2 = Date.now() - this.lastClearTime
    if (elapsed1 > this.refreshInterval) {
      if (elapsed2 > this.clearInterval) {
        this.history.clear()
        this.lastClearTime = Date.now()
      }
      for (const item of this.buffer) {
        this.history.set(item[0], item[1])
      }
      this.buffer.clear()
      this.lastRefreshTime = Date.now()
    }
  }
}

export default BufferCache
