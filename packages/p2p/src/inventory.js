import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
/**
 * p2p peer
 * @param {*} host
 * @param {*} port: Local IP address to bind to socket, default is any.
 * @param {*} httpPort: Local IP address to bind to http, default is any.
 * @param {*} family: 4 = IPv4-only, 6 = IPv6-only, 0 = either (default).
 */
export class Peer {
  /**
   * 创建一个新的 Peer 实例
   * @param {Object} peerInfo - 节点信息对象
   */
  constructor(peerInfo) {
    // 确保参数是一个对象
    const peer = typeof peerInfo === 'object' ? peerInfo : {};
    const { host, port, httpPort = 8000, family = 0 } = peer;

    // 基本验证
    if (!host || !port) {
      throw new Error('Invalid peer configuration: host and port are required');
    }

    // 设置基本属性
    this.host = host;
    this.ip = peer.ip || host; // 兼容性处理

    // 保持 port 的原始格式
    this.port = typeof port === 'string' ? port : String(port);

    // 处理 httpPort，确保存在且有效
    this.httpPort = typeof httpPort === 'string' ? httpPort : String(httpPort);

    // 设置其他属性
    this.family = family;

    // 设置状态，默认为 pending，等待连接验证后再设置为 ready
    this.status = peer.status !== undefined ? peer.status : Peer.STATUS.pending;
    this.delay = peer.delay !== undefined ? peer.delay : 0;
    this.failCount = peer.failCount !== undefined ? peer.failCount : 0;

    // 生成唯一 ID
    this.id = Peer.getId(`${this.host}:${this.port}`)
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

    // 确保目录存在
    const dbDir = path.dirname(this.dbfile)
    if (!fs.existsSync(dbDir)) {
      try {
        fs.mkdirSync(dbDir, { recursive: true })
        this.logger.debug(`Created directory for peer database: ${dbDir}`)
      } catch (err) {
        this.logger.error(`Failed to create directory for peer database: ${dbDir}`, err)
      }
    }

    // 加载现有的 peers
    if (fs.existsSync(this.dbfile)) {
      try {
        const data = fs.readFileSync(this.dbfile, 'utf8')
        if (data && data.trim()) {
          const peers = JSON.parse(data)
          this.logger.debug(`Loaded ${peers.length} peers from inventory, current dbfile is ${this.dbfile}`)
          for (const peer of peers) {
            this.peers.set(peer.id, peer)
          }
        } else {
          this.logger.debug(`Peer database file exists but is empty: ${this.dbfile}`)
        }
      } catch (err) {
        this.logger.error(`Failed to load peer database: ${this.dbfile}`, err)
      }
    } else {
      this.logger.debug(`Peer database file does not exist, will be created: ${this.dbfile}`)
      // 初始化空数据库文件
      this._persistPeers()
    }
  }

  has(id) {
    return this.peers.has(id);
  }

  get(id) {
    return this.peers.get(id)
  }

  /**
   * 添加新节点到库存中
   * @param {Object} peerInfo - 节点信息
   */
  add(peerInfo) {
    try {
      this.logger.debug('Adding to inventory, peer is ', peerInfo)

      // 如果节点不存在，创建新节点
      if (!this.peers.has(peerInfo.id)) {
        // 创建新的 Peer 实例，使用完整的 peerInfo 对象
        const newPeer = new Peer(peerInfo);
        this.peers.set(newPeer.id, newPeer);
        this.logger.debug(`Added new peer ${newPeer.host}:${newPeer.port} with httpPort ${newPeer.httpPort}`);
      } else {
        // 如果节点已存在，更新其信息
        const existingPeer = this.peers.get(peerInfo.id);

        // 更新 httpPort，如果它不存在或为 null
        if ((!existingPeer.httpPort || existingPeer.httpPort === null) && peerInfo.httpPort) {
          this.update(peerInfo.id, { httpPort: peerInfo.httpPort });
        }
      }

      // 持久化更新
      this._persistPeers()
    } catch (err) {
      this.logger.error('Failed to add peer:', err)
    }
  }

  /**
   * 更新节点信息
   * @param {string} id - 节点ID
   * @param {Object} data - 要更新的数据
   */
  update(id, data) {
    const peer = this.peers.get(id)
    if (!peer) return;

    let modified = false;

    // 使用 Object.entries 处理所有属性
    for (const [key, value] of Object.entries(data)) {
      // 特殊处理 httpPort
      if (key === 'httpPort' && value !== undefined && value !== null) {
        // 确保 httpPort 是字符串格式
        const portStr = String(value);
        const isValidPort = /^\d+$/.test(portStr) && Number(portStr) > 0;

        if (isValidPort && peer[key] !== portStr) {
          peer[key] = portStr;
          modified = true;
          this.logger.debug(`Updated httpPort for peer ${peer.host}:${peer.port} to ${portStr}`);
        }
      } else if (value !== undefined && peer[key] !== value) {
        // 其他属性的常规更新
        peer[key] = value;
        modified = true;
      }
    }

    // 只有在有修改时才持久化
    if (modified) {
      this._persistPeers();
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

  /**
   * 将节点信息持久化到文件
   * @private
   */
  _persistPeers() {
    try {
      // 确保目录存在
      const dbDir = path.dirname(this.dbfile)
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true })
        this.logger.debug(`Created directory for peer database: ${dbDir}`)
      }

      // 将所有节点信息序列化并保存
      const peersData = [...this.peers.values()].map(peer => ({
        id: peer.id,
        host: peer.host,
        ip: peer.ip || peer.host,  // 确保兼容性
        port: peer.port,
        httpPort: peer.httpPort,
        family: peer.family,
        status: peer.status,
        failCount: peer.failCount,
        delay: peer.delay
      }));

      // 写入文件
      fs.writeFileSync(this.dbfile, JSON.stringify(peersData, null, 2))
      this.logger.debug(`Persisted ${peersData.length} peers to ${this.dbfile}`);

      // 如果没有节点，尝试从配置中加载种子节点
      if (peersData.length === 0) {
        this.logger.debug('No peers in inventory, consider adding seed nodes manually');
      }
    } catch (err) {
      this.logger.error(`Failed to persist peers to ${this.dbfile}:`, err)
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
    this.peers.forEach(peer => {
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
    let readyCount = 0
    let pendingCount = 0

    this.peers.forEach(peer => {
      if (peer.status !== Peer.STATUS.disable) {
        // this.logger.debug(` peer is  ${JSON.stringify(peer)}`)
        result.push(peer)

        // 统计不同状态的节点数量
        if (peer.status === Peer.STATUS.ready) {
          readyCount++
        } else if (peer.status === Peer.STATUS.pending) {
          pendingCount++
        }
      }
    })

    this.logger.debug(`All enabled peers ${result.length} of all peers ${this.peers.size} (ready: ${readyCount}, pending: ${pendingCount})`)
    return result
  }

  getRandomPeer() {
    this.logger.debug('getRandomPeer starting...')

    // 只获取状态为 ready 的节点
    const readyPeers = [];
    this.peers.forEach(peer => {
      if (peer.status === Peer.STATUS.ready) {
        readyPeers.push(peer);
      }
    });

    if (readyPeers.length === 0) {
      this.logger.debug('No available ready peers')
      return null
    }

    const rnd = Math.floor(Math.random() * readyPeers.length)
    this.logger.debug('Random peer pos: ', rnd, readyPeers.length)
    return readyPeers[rnd]
  }

  // 修改addMap方法确保数据完整性
  addMap(id) {
    try {
      const hasPeer = this.peers.has(id)
      if (hasPeer) {
        const peer = this.peers.get(id)
        // 如果节点已存在，将其状态设置为 pending，等待连接验证
        peer.status = Peer.STATUS.pending
        peer.failCount = 0
        peer.delay = 0
        this.logger.debug(`Updated existing peer ${peer.host}:${peer.port} status to pending`)
      } else {
        try {
          // 尝试从数据库加载节点
          const peers = JSON.parse(fs.readFileSync(this.dbfile))
          let peer = peers.find(item => item.id === id)
          if (!peer) {
            // 如果找不到指定节点，随机选择一个
            if (peers.length > 0) {
              const rnd = Math.floor(Math.random() * peers.length)
              peer = peers[rnd]
              this.logger.debug(`Could not find peer with id ${id}, using random peer ${peer.host}:${peer.port}`)
            } else {
              throw new Error('No peers available in database')
            }
          }

          // 创建新节点，初始状态为 pending
          const newPeer = new Peer({
            host: peer.host,
            port: peer.port,
            httpPort: peer.httpPort,
            family: peer.family,
            status: Peer.STATUS.pending // 显式设置状态为 pending
          })

          this.peers.set(peer.id, newPeer)
          this.logger.debug(`Added new peer ${newPeer.host}:${newPeer.port} with status pending`)
        } catch (err) {
          this.logger.error(`Failed to load peers from database: ${err.message}`)
        }
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
          this._persistPeers()
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
