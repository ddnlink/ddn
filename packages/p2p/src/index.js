import net from 'net'
import { Pipe } from './pipe'
import { Message } from './message'
import { Inventory, Peer } from './inventory'
import { parseUrl } from './util'
import { Cache } from './cache'

/**
 *
 * @param {*} port
 * @param {*} host should ip, not localhost
 * @param {*} options
 *   options.timeout: connect or reply waiting time.
 *   options.cycle: loop cycle discover task.
 *   options.seeds: seed node, like [{ ip: '10.21.21.101, port: 9001}].
 *   options.version: protocol version default v1.
 *   options.nethash: ddn nethash default 0ab796cd.
 *   options.routes: app process function map, like { 'GET /blocks': () => {} }.
 *   options.maxConnectSize: pool size, exceed this number new pipe not be kept.
 */
export class P2P {
  // extends EventEmitter {
  /**
   * 创建 P2P 实例
   * @param {Object} options - 配置选项
   */
  constructor(options) {
    // 确保选项是一个对象
    options = options || {}

    // 设置基本属性
    this.port = typeof options.port === 'string' ? options.port : String(+options.port || 9000)
    this.httpPort = typeof options.httpPort === 'string' ? options.httpPort : String(+options.httpPort || 8000)
    this.host = options.host || '0.0.0.0'

    // 设置其他属性
    this.cycle = +options.cycle || 10000
    this.timeout = +options.timeout || 60000
    this.version = options.version || 'v1'
    this.nethash = options.nethash || '0ab796cd'
    this.family = options.family
    this.routes = options.routes || {}
    this.maxConnectSize = +options.maxConnectSize || 8
    this.logger = options.logger || console

    // 处理 seeds，确保每个 seed 都是完整的 peer 对象
    this.seeds = (options.seeds || []).map(seed => {
      // 如果 seed 没有 httpPort，计算一个默认值
      if (!seed.httpPort && seed.port) {
        seed.httpPort = String(Number(seed.port) - 1000);
        // 确保端口合理
        if (Number(seed.httpPort) < 1000) {
          seed.httpPort = '8000';
        }
      }

      // 确保 ip 和 host 字段存在
      seed.ip = seed.ip || seed.host;
      seed.host = seed.host || seed.ip;

      return seed;
    })

    // fixme: 什么时候为 true ？
    this.ready = false

    this.id = Peer.getId(`${this.host}:${this.port}`)
    // Forward Information Base
    this.fib = new Cache()
    // remember open sockets
    this.pool = new Cache({ max: this.maxConnectSize, clean: pipe => pipe.close() })
    this.inventory = new Inventory({ dbfile: options.dbfile, logger: this.logger })
  }

  /**
   * init this server
   */
  /**
   * 初始化 P2P 网络
   */
  prepare() {
    const self = this
    self.listen()

    // 打印 seeds 列表
    self.logger.debug(`Seeds list: ${JSON.stringify(self.seeds)}`)

    // 先将种子节点添加到 inventory
    if (self.seeds && self.seeds.length > 0) {
      self.logger.debug(`Adding ${self.seeds.length} seed nodes to inventory`)

      self.seeds.forEach(seed => {
        self.logger.debug(`Processing seed: ${JSON.stringify(seed)}`)

        // 确保关键属性存在
        if (!seed.host && !seed.ip) {
          self.logger.warn('Seed without host or ip, skipping')
          return
        }

        if (!seed.port) {
          self.logger.warn(`Seed without port: ${seed.host || seed.ip}, skipping`)
          return
        }

        // 生成 ID
        if (!seed.id) {
          seed.id = Peer.getId(`${seed.host || seed.ip}:${seed.port}`)
          self.logger.debug(`Generated ID for seed: ${seed.id}`)
        }

        // 跳过自身
        if (seed.id === self.id) {
          self.logger.debug(`Skipping self seed: ${seed.id}`)
          return
        }

        // 创建完整的 Peer 对象
        try {
          const peer = new Peer({
            ...seed,
            host: seed.host || seed.ip,
            ip: seed.ip || seed.host
          })

          self.logger.debug(`Created peer from seed: ${JSON.stringify(peer)}`)

          // 添加到 inventory
          self.inventory.add(peer)
        } catch (err) {
          self.logger.error(`Failed to create peer from seed: ${JSON.stringify(seed)}`, err)
        }
      })
    } else {
      self.logger.warn('No seed nodes found in configuration')
    }

    // 连接到种子节点
    const seedPeers = self.inventory.getAllPeers().slice(0, self.maxConnectSize)
    self.logger.debug(`Connecting to ${seedPeers.length} seed peers`)

    seedPeers.forEach(peer => {
      if (peer.id === self.id) return

      // 直接传递完整的 peer 对象
      self.connect(peer).catch(err => {
        if (err.errno === 'ECONNREFUSED') {
          self.logger.error(`connect to seed: ${peer.ip || peer.host}:${peer.port} fail: ECONNREFUSED`)
        } else {
          self.logger.error(`connect to seed: ${peer.ip || peer.host}:${peer.port} fail:`, err.message)
        }
      })
    })

    self._discoverHandle = setInterval(self._discover.bind(self), self.cycle)
    self._sortHandle = setInterval(self._sortPeers.bind(self), self.cycle * 360)

    // todo: 什么时候算 ready 了？这里是自己本身被监听了，其他都执行了，其他节点也都执行了，但成本与否并未确定 imfly 20240630
    self.ready = true
  }

  /**
   * listen to other peers connect event
   */
  listen() {
    const self = this
    self._server = net.createServer()
    self._server.listen(
      {
        port: self.port,
        host: '0.0.0.0' // note: 这里不使用 self.host，因为 self.host 大概率是 publicIp，有些云主机没有绑定网卡
      },
      () => {
        self.family = self._server.address().family
        self.logger.debug(`P2P server start to listen port: ${self.port}`)
      }
    )

    self._server.on('connection', async socket => {
      const pipe = self._createPipe({ socket, isOpen: true })
      try {
        const res = await pipe.request(Message.commands.VERSION)
        const remote = res && res.data
        if (!remote) return
        const peer = new Peer(remote)
        self._addPipe(pipe, peer)
      } catch (err) {
        self.logger.error('Get remote peer version info failure', err.message)
      }
    })
  }

  /**
   * connect to a p2p server
   * @param {*} host
   * @param {*} port
   * @param {*} proxy
   * @returns
   */
  /**
   * 连接到远程节点
   * @param {Object|string} peerOrPort - 节点对象或端口号
   * @param {string} [hostOrNull] - 主机地址（如果第一个参数是端口号）
   * @param {Object} [proxyOrNull] - 代理配置（可选）
   * @returns {Promise<Pipe>} 连接管道
   */
  async connect(peerOrPort, hostOrNull, proxyOrNull) {
    const self = this
    return new Promise((resolve, reject) => {
      let peerInfo;

      // 处理不同的调用方式
      if (typeof peerOrPort === 'object') {
        // 如果第一个参数是对象，则它是完整的 peer 对象
        peerInfo = peerOrPort;
      } else {
        // 兼容旧的调用方式：connect(port, host, proxy)
        const port = peerOrPort;
        const host = hostOrNull;
        const proxy = proxyOrNull;

        // 创建一个完整的 peer 对象
        peerInfo = { host, port };

        // 尝试从 seeds 中找到匹配的节点的 httpPort
        const matchingSeed = self.seeds.find(seed =>
          (seed.ip === host || seed.host === host) &&
          (seed.port === port || String(seed.port) === String(port)));

        if (matchingSeed && matchingSeed.httpPort) {
          peerInfo.httpPort = matchingSeed.httpPort;
          self.logger.debug(`Found httpPort ${peerInfo.httpPort} for ${host}:${port} from seeds`);
        } else {
          // 如果在 seeds 中找不到，则计算一个默认值
          peerInfo.httpPort = String(Number(port) - 1000);
          // 确保端口合理
          if (Number(peerInfo.httpPort) < 1000) {
            peerInfo.httpPort = '8000';
          }
          self.logger.debug(`Using calculated httpPort ${peerInfo.httpPort} for ${host}:${port}`);
        }

        // 设置代理（如果有）
        if (proxy) {
          peerInfo.proxy = proxy;
        }
      }

      // 创建 Peer 实例
      const peer = new Peer(peerInfo);

      // 检查是否是自身
      if (peer.id === self.id) {
        self.logger.warn(`Should not connect self: ${peer.host}:${peer.port}`);
        reject(new Error(`Should not connect to self: ${peer.host}:${peer.port}`));
        return;
      }

      // 检查是否已经连接
      if (self.pool.has(peer.id)) {
        resolve(self.pool.get(peer.id));
        return;
      }
      // if(this.pool.size >= this.maxConnectSize) {
      //   this.logger.debug(`pool is up to maxConnectSize: ${this.maxConnectSize} `)
      //   reject(`pool is up to maxConnectSize: ${this.maxConnectSize} `)
      // }
      // create a tcp connect
      const pipe = self._createPipe({ proxy: peerInfo.proxy })

      pipe.open(peer.port, peer.host, err => {
        if (err) {
          const errMsg = err.errno === 'ECONNREFUSED' ? 'ECONNREFUSED' : err.message
          self.logger.warn(`connect to ${peer.host}:${peer.port} error: `, errMsg)
          self.inventory.disable(peer.id)
          reject(err)
          return
        }
        self._addPipe(pipe, peer)
        resolve(pipe)
      })
    })
  }

  /**
   * Delegate the close server method to backend.
   *
   * @param callback
   */
  close(callback) {
    clearInterval(this._discoverHandle)
    clearInterval(this._sortHandle)

    // close the net port if exist
    if (this._server) {
      this._server.removeAllListeners('data')
      this._server.close(callback)

      this.pool.reset()

      this.logger.debug({ action: 'close server' })
    } else {
      this.logger.debug({ action: 'close server', warning: 'server already closed' })
    }
  }

  /**
   * GET method request data from peer
   * @param {*} api
   * @param {*} params
   * @param {*} node
   * @returns
   */
  async get(api, params, node) {
    return await this._request(Message.commands.GET, api, params, node)
  }

  /**
   * POST method request data from peer
   * @param {*} api
   * @param {*} data
   * @param {*} node
   * @returns
   */
  async post(api, data, node) {
    return await this._request(Message.commands.POST, api, data, node)
  }

  /**
   * PUT method request data from peer
   * @param {*} api
   * @param {*} data
   * @param {*} node
   * @returns
   */
  async put(api, data, node) {
    return await this._request(Message.commands.PUT, api, data, node)
  }

  /**
   * DELETE method request data from peer
   * @param {*} api
   * @param {*} params
   * @param {*} node
   * @returns
   */
  async delete(api, params, node) {
    return await this._request(Message.commands.DELETE, api, params, node)
  }

  /**
   * broadcast data to all connected peer
   * @param {*} api
   * @param {*} data
   */
  broadcast(api, data, signature) {
    if (typeof api === 'object') {
      data = api.data
      api = api.api
    }
    if (!api || !data) return
    const self = this
    const { type, checksum, size, payload } = Message.getMetadata(data)
    const key = signature || checksum
    const fib = self.fib.get(key) || [self.id]
    // 使用优质节点进行广播
    const peers = this.inventory.getNextHop(fib, 11).filter(peer => peer.failCount < this.inventory.tryTimes / 2) // 额外过滤低质量节点
    fib.push(...peers.map(peer => peer.id))
    peers.forEach(async peer => {
      try {
        if (self.id === peer.id) return
        if (!self.pool.has(peer.id)) {
          // 直接传递完整的 peer 对象
          await self.connect(peer)
        }

        const pipe = self.pool.get(peer.id)
        pipe.send(Message.commands.PUSH, payload, { fib, api, type, checksum, size, signature })
      } catch (err) {
        self.logger.error('broadcast data failed', err)
        throw err
      }
    })
  }

  _delPipe(pipe) {
    if (!pipe.id) return
    this.pool.delete(pipe.id)
    this.inventory.disable(pipe.id)
    this.logger.debug(`success remove pipe from pool: ${pipe.id}`)
  }

  _addPipe(pipe, peer) {
    pipe.id = peer.id
    pipe.host = peer.host
    pipe.port = peer.port
    pipe.httpPort = peer.httpPort // 添加 httpPort 属性
    this.pool.set(pipe.id, pipe)

    // 只在节点不存在时添加到 inventory
    if (!this.inventory.get(peer.id)) {
      this.logger.debug(`peer isn't exit, add peer to inventory: ${peer.host}:${peer.port} with httpPort: ${peer.httpPort}`)
      this.inventory.add(peer)
    } else {
      // 如果节点已存在，但没有 httpPort，则更新它
      const existingPeer = this.inventory.get(peer.id)
      if ((!existingPeer.httpPort || existingPeer.httpPort === null) && peer.httpPort) {
        this.logger.debug(`Updating httpPort for existing peer: ${peer.host}:${peer.port} to ${peer.httpPort}`)
        this.inventory.update(peer.id, { httpPort: peer.httpPort })
      }
    }

    // 连接成功后，将节点状态设置为 ready
    this.inventory.update(peer.id, { status: Peer.STATUS.ready })
    this.logger.debug(`Peer ${peer.host}:${peer.port} connection successful, status set to ready`)

    this.logger.debug(
      `${this.port} success connect to peer: ${peer.host}:${peer.port} socket: ${pipe.socket.remotePort}`
    )
  }

  /**
   * private method, add the connection to pool
   * @param {*} socket
   * @returns
   */
  _createPipe(options) {
    const opt = {
      version: this.version,
      nethash: this.nethash,
      timeout: this.timeout || 15000,
      logger: this.logger,
      ...options
    }
    const pipe = new Pipe(opt)

    const self = this
    self.count = (self.count || 0) + 1
    pipe.on('message', msg => {
      self._processMessage(msg, pipe)
    })
    pipe.on('close', err => {
      this.logger.warn('socket is closed: ', err)
      self._delPipe(pipe)
    })
    pipe.on('error', err => {
      const errMsg = err.errno === 'ECONNREFUSED' ? 'ECONNREFUSED' : err.message
      this.logger.warn(`socket is error: ${self.count}`, errMsg)
      self._delPipe(pipe)
    })
    return pipe
  }

  /**
   * answer to the peer requesting
   * @param {*} data
   */
  _response(pipe, data, serial) {
    try {
      pipe.send(Message.commands.RESPONSE, data, undefined, serial)
    } catch (err) {
      this.logger.error('response failed', err)
    }
  }

  /**
   * private method, request some kind of data from any peer
   * @todo 出错时是抛出还是返回?
   * @param {*} cmd GET POST PUT DELETE
   * @param {*} api request url
   * @param {*} params request params
   * @param {*} node optional
   * @returns
   */
  async _request(method, api, data, node) {
    try {
      // 创建排除集合，避免重复请求失败节点
      const excludeIds = new Set()
      let retryCount = 0
      let peer

      do {
        peer = !node ? this.inventory.getSmartRandomPeer(excludeIds) : node
        if (!peer) {
          this.logger.warn('Not found valid peer')
          return
        }

        // 将当前peer加入排除集合，避免下次重试时再次选择
        excludeIds.add(peer.id)

        try {
          const { id, host, port } = peer
          if (!id && (!host || !port)) {
            this.logger.warn(`The peer is not valid: ${host}:${port}`)
            return
            // throw new Error(`The peer is not valid: ${host}:${port}`)
          }
          if (this.host === host && this.port === port) {
            this.logger.warn(`Should not request to yourself: ${host}:${port}`)
            return
          }
          // 使用完整的 peer 对象
          const pipe = await this.connect(peer)
          if (!pipe) {
            this.logger.warn(`Pipe connect to ${host}:${port} failed.`)
            return
          }
          const msg = await pipe.request(method, data, { api })
          if (!this.pool.has(pipe.id)) {
            pipe.close()
          }
          return { peer, body: msg.data }
        } catch (err) {
          retryCount++
          if (retryCount >= 3) {
            throw err
          }
        }
      } while (retryCount < 3)

    } catch (err) {
      const errMsg = err.errno === 'ECONNREFUSED' ? 'ECONNREFUSED' : err.message
      this.logger.warn('request data error: ', errMsg)
      throw err
    }
  }

  async _callApi(msg, peer) {
    try {
      const meta = msg.meta || {}
      if (!meta.api) return { error: `404: route: ${meta.api} notfound` }
      const { params, pathname } = parseUrl(meta.api)
      const req = { body: msg.data, params, peer }
      const cmd = msg.cmd === Message.commands.PUSH ? Message.commands.POST : msg.cmd
      const reg = new RegExp(`^${Message.methods[cmd]}\\s*${pathname}$`, 'i')
      const key = Object.keys(this.routes).find(path => {
        return reg.test(path.trim())
      })
      // this.logger.debug(`got request to: ${key}, ${cmd}, ${pathname}`, reg)
      const action = !key ? undefined : this.routes[key]
      if (!action) return { error: '404: notfound' }
      return await action(req)
    } catch (err) {
      this.logger.error('call api error: ', err)
      throw err
    }
  }

  /**
   * private method, call bussiness process code according routes
   * @param {*} msg
   * @param {*} pipe
   * @returns
   */
  async _processMessage(msg, pipe) {
    let peer = this.inventory.get(pipe.id)
    if (!peer) {
      // 如果节点不存在，添加到库存
      this.inventory.addMap(pipe.id)
      peer = this.inventory.get(pipe.id)
    } else if (peer.status === Peer.STATUS.disable) {
      // 如果节点被禁用，重新启用并设置为 ready 状态
      this.inventory.update(peer.id, { status: Peer.STATUS.ready, failCount: 0, delay: 0 })
      this.logger.debug(`Re-enabled peer ${peer.host}:${peer.port}, status set to ready`)
    } else if (peer.status === Peer.STATUS.pending) {
      // 如果节点处于 pending 状态，设置为 ready
      this.inventory.update(peer.id, { status: Peer.STATUS.ready })
      this.logger.debug(`Peer ${peer.host}:${peer.port} status updated from pending to ready`)
    }
    switch (msg.cmd) {
      case Message.commands.PUSH: {
        const { signature, checksum, fib } = msg.meta || {}
        const key = signature || checksum
        const myfib = this.fib.get(key)
        if (myfib) {
          this.cache.set(key, [...new Set([...myfib, ...fib])])
          return
        }
        await this._callApi(msg, peer)
        break
      }
      case Message.commands.GET:
      case Message.commands.POST:
      case Message.commands.PUT:
      case Message.commands.DELETE: {
        const res = await this._callApi(msg, peer)
        this._response(pipe, res, msg.serial)
        break
      }
      case Message.commands.VERSION: {
        const { id, version, nethash, host, port, httpPort = this.httpPort, family } = this
        const info = { id, version, nethash, host, port, httpPort, family }
        this._response(pipe, info, msg.serial)
        break
      }
      case Message.commands.INVENTORY: {
        const peers = this.inventory.getAllPeers()
        this._response(pipe, peers, msg.serial)
        break
      }
    }
  }

  /**
   * discover peer from any a peer
   */
  async _discover() {
    try {
      // 如果没有节点，先尝试从 seeds 中加载
      if (this.inventory.getAllPeers().length === 0) {
        this.logger.debug('No peers in inventory, adding seed nodes')
        // 将种子节点添加到 inventory
        this.seeds.forEach(seed => {
          if (!seed.id) {
            seed.id = Peer.getId(`${seed.host || seed.ip}:${seed.port}`)
          }

          // 跳过自身
          if (seed.id === this.id) return

          // 创建新节点，初始状态为 pending
          const peer = new Peer(seed)
          this.inventory.add(peer)

          // 尝试连接该节点
          this.connect(peer).catch(err => {
            this.logger.warn(`Failed to connect to seed node ${peer.host}:${peer.port}: ${err.message}`)
          })
        })
      }

      // 保持可靠性优先，但不排除已连接节点（发现需要与已连接节点交互）
      const peer = this.inventory.getReliablePeers(1)[0] || this.inventory.getRandomPeer()

      if (!peer || this.id === peer.id) {
        this.logger.debug('No suitable peer found for discovery')
        return
      }

      // 如果节点不在连接池中，先连接
      if (!this.pool.has(peer.id)) {
        this.logger.debug(`Connecting to peer for discovery: ${peer.host || peer.ip}:${peer.port}`)
        try {
          // 直接传递完整的 peer 对象
          await this.connect(peer)
        } catch (err) {
          this.logger.error(`Failed to connect to peer for discovery: ${peer.host || peer.ip}:${peer.port}`, err.message)
          return
        }
      }

      // 获取节点的连接管道
      const pipe = this.pool.get(peer.id)
      if (!pipe) {
        this.logger.error(`Pipe not found for peer: ${peer.host || peer.ip}:${peer.port}`)
        return
      }

      // 请求节点列表
      this.logger.debug(`Requesting inventory from peer: ${peer.host || peer.ip}:${peer.port}`)
      const res = await pipe.request(Message.commands.INVENTORY)
      const peers = res && res.data

      if (peers && Array.isArray(peers)) {
        this.logger.debug(`Received ${peers.length} peers from ${peer.host || peer.ip}:${peer.port}`)
        const self = this

        // 处理每个返回的节点
        peers.forEach(item => {
          // 确保关键属性存在
          if (!item.host && !item.ip) {
            self.logger.warn('Received peer without host or ip, skipping')
            return
          }

          if (!item.port) {
            self.logger.warn(`Received peer without port: ${item.host || item.ip}, skipping`)
            return
          }

          // 创建完整的 peer 对象
          const newPeer = new Peer({
            ...item,
            host: item.host || item.ip,
            ip: item.ip || item.host
          })

          // 跳过自身节点
          if (newPeer.id === self.id) return

          // 只在节点不存在时添加到 inventory
          if (!self.inventory.get(newPeer.id)) {
            self.logger.debug(`Adding new peer to inventory: ${newPeer.host}:${newPeer.port} with httpPort: ${newPeer.httpPort}`)
            self.inventory.add(newPeer)
          } else {
            // 如果节点已存在，更新其信息
            const existingPeer = self.inventory.get(newPeer.id)

            // 检查是否需要更新 httpPort
            if ((!existingPeer.httpPort || existingPeer.httpPort === '0') && newPeer.httpPort) {
              self.logger.debug(`Updating httpPort for existing peer: ${newPeer.host}:${newPeer.port} to ${newPeer.httpPort}`)
              self.inventory.update(newPeer.id, { httpPort: newPeer.httpPort })
            }
          }
        })
      } else {
        this.logger.debug(`No peers received from ${peer.host || peer.ip}:${peer.port}`)
      }

      this.inventory.flush()
      this.inventory.enableAll()
      // this.logger.debug('all peers: ', this.inventory.getAllPeers())
    } catch (err) {
      this.logger.error('Discove peer failed', err)
    }
  }

  /**
   * sort peer and verify the connection of inventory
   */
  async _sortPeers() {
    const self = this
    try {
      // 优先处理健康节点
      const healthyPeers = this.inventory.getHealthyPeers()
      healthyPeers.forEach(async peer => {
        if (!this.pool.has(peer.id)) {
          try {
            await this.connect(peer)
            const pipe = this.pool.get(peer.id)
            let time = await pipe.ping()
            for (let i = 0; i < 3; i++) {
              const againTime = await pipe.ping()
              time = againTime < time ? againTime : time
            }
            self.inventory.update(peer.id, { time })
          } catch (err) {
            this.logger.warn('ping err: ', err.message)
          }
        }
      })
    } catch (err) {
      this.logger.error('discover task failed', err)
    }
  }
}
