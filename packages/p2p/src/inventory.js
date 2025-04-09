import fs from 'fs'
import crypto from 'crypto'
/**
 * p2p peer
 * @param {*} host
 * @param {*} port: Local IP address to bind to socket, default is any.
 * @param {*} httpPort: Local IP address to bind to http, default is any.
 * @param {*} family: 4 = IPv4-only, 6 = IPv6-only, 0 = either (default).
 */
export class Peer {
  constructor({ host, port, httpPort = null, family = 0 }) {
    // 增加端口有效性校验
    if (!host || !port) throw new Error('Invalid peer configuration: host and port are required')

    this.id = Peer.getId(`${host}:${port}`)
    this.host = host
    this.port = +port
    this.httpPort = (httpPort !== null && !isNaN(httpPort)) ? +httpPort : null
    this.family = family
    this.status = Peer.STATUS.ready
    this.delay = 0
    this.failCount = 0
  }

  static getId(data) {
    return crypto.createHash('md5').update(Buffer.from(data)).digest().toString('hex')
  }

  setProxy(host, port) {
    this.proxy = {
      host,
      port
    }
  }

  setStatus() {
    this.status = Peer.STATUS.pending
    this.delay = 0
    this.failCount = 0
  }
}

Peer.STATUS = {
  disable: 0,
  pending: 1,
  ready: 2
}

// fixme: 这个属性可能不需要
Peer.FAMILY = {
  IPv4: 4,
  IPv6: 6,
  either: 0,
}

/**
 * peer list
 * @param {*} options
 *   options.delayTime: Next retry time interval.
 *   options.tryTimes: Retry times before remove it.
 *   options.dbfile: Filepath to persist the peers data.
 */
export class Inventory {
  constructor(options) {
    options = options || {}
    this.peers = new Map()
    this.delayTime = options.delayTime || 3600
    this.tryTimes = options.tryTimes || 5
    this.dbfile = options.dbfile || '../peer.db'
    this.logger = options.logger || console

    if (fs.existsSync(this.dbfile)) {
      const peers = JSON.parse(fs.readFileSync(this.dbfile))
      this.logger.debug('Peer is loaded from inventory, current dbfile is ', this.dbfile)
      for (const peer of peers) {
        this.peers.set(peer.id, peer)
      }
    }
  }

  has(id) {
    return this.peers.has(id);
  }

  get(id) {
    return this.peers.get(id)
  }

  add(peer) {
    try {
      this.logger.debug('Adding to inventory, peer is ', peer)
      if (!this.peers.has(peer.id)) {
        // 确保创建新Peer时包含所有必要字段
        const newPeer = new Peer({
          host: peer.host,
          port: peer.port,
          httpPort: peer.httpPort || null,
          family: peer.family || Peer.FAMILY.either
        })
        this.peers.set(peer.id, newPeer)
      }
      this._persistPeers()
    } catch (err) {
      this.logger.error('Failed to add peer:', err)
    }
  }

  update(id, data) {
    const peer = this.peers.get(id)
    for (const key of data) {
      peer[key] = data[key]
    }
  }

  remove(id) {
    this.peers.delete(id)
    fs.writeFileSync(this.dbfile, JSON.stringify([...this.peers.values()]))
  }

  flush() {
    fs.writeFileSync(this.dbfile, JSON.stringify([...this.peers.values()]))
  }

  disable(id) {
    const peer = this.peers.get(id)
    if (!peer) return

    peer.status = Peer.STATUS.disable
    peer.failCount = +peer.failCount + 1

    // 增加强制删除条件：连续失败超过阈值或延迟时间过长
    if (peer.failCount > this.tryTimes ||
      (peer.delay > 0 && Date.now() - peer.delay > this.delayTime * 1000 * 3)) {
      this.logger.debug('Removing problematic peer:', peer.host, peer.port)
      this.remove(id)
      return
    }

    peer.delay = Date.now() + this.delayTime * 1000
    this._persistPeers()
  }

  // 新增私有方法处理持久化逻辑
  _persistPeers() {
    try {
      const peersData = [...this.peers.values()].map(peer => ({
        id: peer.id,
        host: peer.host,
        port: peer.port,
        httpPort: peer.httpPort,
        family: peer.family,
        status: peer.status,
        failCount: peer.failCount,
        delay: peer.delay
      }))
      fs.writeFileSync(this.dbfile, JSON.stringify(peersData))
    } catch (err) {
      this.logger.error('Failed to persist peers:', err)
    }
  }

  enable(id) {
    const peer = this.peers.get(id)
    if (!peer) return

    peer.status = Peer.STATUS.pending
    peer.failCount = 0
    peer.delay = 0
  }

  enableAll() {
    this.peers.forEach((peer, id) => {
      if (peer.status === Peer.STATUS.disable && Date.now() > peer.delay) {
        peer.status = Peer.STATUS.pending
        peer.failCount = 0
        peer.delay = 0
      }
    })
  }

  getAllPeers() {
    this.logger.debug('getAllPeers starting...')

    const result = []
    this.peers.forEach(peer => {
      if (peer.status !== Peer.STATUS.disable) {
        // this.logger.debug(` peer is  ${JSON.stringify(peer)}`)
        result.push(peer)
      }
    })
    this.logger.debug(`All enabled peers ${result.length} of all peers ${this.peers.size}`)
    return result
  }

  getRandomPeer() {
    this.logger.debug('getRandomPeer starting...')

    const peers = this.getAllPeers()
    if (peers.length === 0) {
      this.logger.debug('No available peers')
      return null
    }
    const rnd = Math.floor(Math.random() * peers.length)
    this.logger.debug('Random peer pos: ', rnd, peers.length)
    return peers[rnd]
  }

  // 修改addMap方法确保数据完整性
  addMap(id) {
    try {
      const hasPeer = this.peers.has(id)
      if (hasPeer) {
        const peer = this.peers.get(id)
        peer.status = Peer.STATUS.ready
        peer.failCount = 0
        peer.delay = 0
      } else {
        const peers = JSON.parse(fs.readFileSync(this.dbfile))
        let peer = peers.find(item => item.id === id)
        if (!peer) {
          const rnd = Math.floor(Math.random() * peers.length)
          peer = peers[rnd]
        }
        // 确保从数据库加载的peer包含所有必要字段
        this.peers.set(peer.id, new Peer({
          host: peer.host,
          port: peer.port,
          httpPort: peer.httpPort,
          family: peer.family
        }))
      }
      this._persistPeers()
    } catch (err) {
      this.logger.error('Failed to add peer by map:', err)
    }
  }

  getNextHop(fib, count) {
    const peers = []
    const results = new Set()
    this.peers.forEach(peer => {
      if (peer.status !== Peer.STATUS.disable && !fib.includes(peer.id)) peers.push(peer)
    })

    count = peers.length > count ? count : peers.length
    for (let i = 0; i < count; i++) {
      const rnd = Math.floor(Math.random() * peers.length)
      results.add(peers[rnd])
    }
    return [...results]
  }

  /**
   * 检查节点健康状态
   * @param {string} id 节点ID
   * @returns {boolean} 是否健康
   */
  isHealthy(id) {
    const peer = this.get(id);
    if (!peer) return false;
    return peer.status === Peer.STATUS.ready &&
      peer.failCount < this.tryTimes &&
      (peer.delay === 0 || Date.now() < peer.delay);
  }

  /**
   * 获取健康节点列表
   * @returns {Array} 健康节点数组
   */
  getHealthyPeers() {
    const result = [];
    this.peers.forEach(peer => {
      if (this.isHealthy(peer.id)) {
        result.push(peer);
      }
    });
    return result;
  }

  /**
   * 获取节点统计信息
   * @returns {Object} 统计信息对象
   */
  getStats() {
    let total = 0;
    let ready = 0;
    let pending = 0;
    let disabled = 0;

    this.peers.forEach(peer => {
      total++;
      if (peer.status === Peer.STATUS.ready) ready++;
      else if (peer.status === Peer.STATUS.pending) pending++;
      else disabled++;
    });

    return {
      total,
      ready,
      pending,
      disabled,
      healthRate: total > 0 ? (ready / total).toFixed(2) : 0
    };
  }

  /**
   * 节流式持久化，避免频繁写入
   */
  _setupPersistThrottle() {
    let pending = false
    return () => {
      if (!pending) {
        pending = true
        setTimeout(() => {
          this._persistPeersSync()
          pending = false
        }, 1000) // 1秒节流
      }
    }
  }

  /**
   * 改进的随机选择方法，避免短时间内重复选择同一节点
   * 
   * const usedIds = new Set(['peer1', 'peer2']);
   * const randomPeer = inventory.getSmartRandomPeer(usedIds);
   *
   * @param {Set} [excludeIds] 需要排除的节点ID集合
   * @returns {Peer|null} 随机节点
   */
  getSmartRandomPeer(excludeIds = new Set()) {
    const peers = this.getAllPeers()
      .filter(peer => !excludeIds.has(peer.id));

    if (peers.length === 0) {
      this.logger.debug('No available peers after exclusion');
      return null;
    }

    const rnd = Math.floor(Math.random() * peers.length);
    return peers[rnd];
  }

  /**
   * 获取最可靠的节点（优先选择ready状态的节点）
   * 
   * const reliablePeer = inventory.getReliablePeers(1)[0];
   * 
   * @param {number} count 需要选择的节点数量
   * @returns {Array} 可靠节点数组
   */
  getReliablePeers(count = 3) {
    const peers = this.getAllPeers()
      .sort((a, b) => {
        // 优先选择ready状态的节点
        if (a.status === Peer.STATUS.ready && b.status !== Peer.STATUS.ready) return -1;
        if (a.status !== Peer.STATUS.ready && b.status === Peer.STATUS.ready) return 1;
        // 其次按失败次数排序
        return a.failCount - b.failCount;
      });

    return peers.slice(0, count);
  }

  /**
   * 获取优质节点（失败次数少的节点）
   * 
   * 获取3个优质节点
   * const qualityPeers = inventory.getQualityPeers(3);
   
   * @param {number} count 需要选择的节点数量
   * @returns {Array} 优质节点数组
   */
  getQualityPeers(count = 3) {
    const peers = this.getAllPeers()
      .filter(peer => peer.failCount < this.tryTimes / 2) // 只选择失败次数少于阈值一半的节点
      .sort((a, b) => a.failCount - b.failCount); // 按失败次数升序排序

    return peers.slice(0, count);
  }
}
