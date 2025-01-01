/**
 * 区块缓存管理类
 * DDN FOUNDATION
 */

class BlockCache {
  constructor(options = {}) {
    this._cache = new Map()
    this._maxSize = options.maxSize || 1000
    this._logger = options.logger
  }

  /**
   * 添加区块到缓存
   * @param {string} blockId 区块ID
   * @param {Object} block 区块数据
   */
  add(blockId, block) {
    if (this._cache.size >= this._maxSize) {
      const firstKey = this._cache.keys().next().value
      this._cache.delete(firstKey)
      this._logger && this._logger.debug(`BlockCache: Remove oldest block ${firstKey} from cache`)
    }
    this._cache.set(blockId, block)
    this._logger && this._logger.debug(`BlockCache: Add block ${blockId} to cache`)
  }

  /**
   * 获取缓存的区块
   * @param {string} blockId 区块ID
   * @returns {Object|undefined} 区块数据
   */
  get(blockId) {
    return this._cache.get(blockId)
  }

  /**
   * 检查区块是否在缓存中
   * @param {string} blockId 区块ID
   * @returns {boolean}
   */
  has(blockId) {
    return this._cache.has(blockId)
  }

  /**
   * 从缓存中移除区块
   * @param {string} blockId 区块ID
   */
  remove(blockId) {
    this._cache.delete(blockId)
    this._logger && this._logger.debug(`BlockCache: Remove block ${blockId} from cache`)
  }

  /**
   * 清空缓存
   */
  clear() {
    this._cache.clear()
    this._logger && this._logger.debug('BlockCache: Clear all cached blocks')
  }

  /**
   * 获取缓存大小
   * @returns {number}
   */
  get size() {
    return this._cache.size
  }
}

export default BlockCache
