/**
 * Very simple a cache implementation
 * @param {*} options
 *   options.duration: live time of the cache data.
 *   options.max: max size of this cache.
 *   options.clean: callback when the data is remove from cache.
 */
export class Cache {
  constructor (options) {
    options = options || {}
    this.duration = options.duration || 3600000
    this.clean = options.clean
    this.max = options.max || Infinity
    this.cache = new Map()
    this.times = new Map()
  }

  get size () {
    return this.cache.size
  }

  has (key) {
    return this.cache.has(key)
  }

  get (key) {
    this.times.set(key, Date.now())
    this._clear(key)
    return this.cache.get(key)
  }

  set (key, data) {
    this.cache.set(key, data)
    this.times.set(key, Date.now())
    this._clear(key)
  }

  delete (key) {
    this.times.delete(key)
    this.cache.delete(key)
  }

  push (key, ...items) {
    const data = this.cache.get(key) || []
    data.concat(items)
    this.cache.set(key, data)
    this.times.set(key, Date.now())
    this._clear(key)
  }

  reset (cb) {
    const keys = [...this.cache.keys()]
    const clean = cb || this.clean

    for (const key of keys) {
      if (clean)clean(this.cache.get(key))
    }
    this.cache = new Map()
    this.times = new Map()
  }

  _clear (hit) {
    const self = this
    function clean (key) {
      if (self.clean)self.clean(self.cache.get(key))
      self.cache.delete(key)
      self.times.delete(key)
    }

    let keys = [...this.cache.keys()]
    keys.forEach(key => {
      if (hit === key) return
      const time = self.times.get(key)
      if (Date.now() - time >= self.duration) {
        clean(key)
      }
    })

    const exceed = self.cache.size - self.max
    if (exceed > 0) {
      keys = [...self.times.keys()].sort((a, b) => a - b)
      keys.slice(0, exceed).forEach(key => {
        clean(key)
      })
    }
  }
}
