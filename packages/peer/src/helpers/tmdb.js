/* ---------------------------------------------------------------------------------------------
 *  Created by DDN Team on Wed Mar 14 2017 16:13:1
 *
 *  Copyright (c) 2019 DDN Foundation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

const LOG_ADD_PATH = 1
const LOG_SET_VALUE = 2

class Tmdb {
  constructor (map) {
    this.map = (map instanceof Map ? map : new Map())
    this.log = new Array()
  }

  set (keys, value) {
    let parent = this.map
    const path = []
    for (let i = 0; i < keys.length - 1; ++i) {
      const k = keys[i]
      let m = parent.get(k)
      path.push(k)
      if (!m) {
        m = new Map()
        this.log.push([path, LOG_ADD_PATH])
        parent.set(k, m)
      }
      parent = m
    }
    const lastKey = keys[keys.length - 1]
    this.log.push([keys, LOG_SET_VALUE, parent.get(lastKey)])
    parent.set(lastKey, value)
  }

  get (keys) {
    let m = this.map
    for (let i = 0; i < keys.length; ++i) {
      m = m.get(keys[i])
      if (!m) {
        return
      }
    }
    return m
  }

  remove_ (keys) {
    let m = this.map
    for (let i = 0; i < keys.length - 1; ++i) {
      m = m.get(keys[i])
      if (!m) {
        return
      }
    }
    m.delete(keys[keys.length - 1])
  }

  set_ (keys, value) {
    let m = this.map
    for (let i = 0; i < keys.length - 1; ++i) {
      m = m.get(keys[i])
      if (!m) {
        return
      }
    }
    const lastKey = keys[keys.length - 1]
    if (value === undefined) {
      m.delete(lastKey)
    } else {
      m.set(lastKey, value)
    }
  }

  rollback () {
    while (this.log.length !== 0) {
      const [keys, type, value] = this.log.pop()
      switch (type) {
        case 1:
          this.remove_(keys)
          break
        case 2:
          this.set_(keys, value)
          break
        default:
          throw new Error('unknow log type')
      }
    }
  }

  commit () {
    this.log = new Array()
  }
}

export default Tmdb
