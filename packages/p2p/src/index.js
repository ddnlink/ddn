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
  constructor (options) {
    // check if we have options
    options = options || {}
    this.port = +options.port || 9001
    this.host = options.host || '0.0.0.0'
    this.cycle = +options.cycle || 10000
    this.timeout = +options.timeout || 60000
    this.version = options.version || 'v1'
    this.nethash = options.nethash || '0ab796cd'
    this.family = options.family
    this.seeds = options.seeds || [] // 来自于配置文件，比如：.ddnrc.js 的 peers.list
    this.routes = options.routes || {}
    this.maxConnectSize = +options.maxConnectSize || 8
    this.logger = options.logger || console

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
  prepare () {
    const self = this
    this.listen()
    this.seeds.slice(0, this.maxConnectSize).forEach(seed => {
      if (seed.id === this.id) return

      self.connect(seed.port, seed.ip).catch(err => {
        if (err.errno === 'ECONNREFUSED') {
          this.logger.debug(`connect to seed: ${seed.ip}:${seed.port} fail: ECONNREFUSED`)
        }
      })
    })

    this._discoverHandle = setInterval(this._discover.bind(this), this.cycle)
    this._sortHandle = setInterval(this._sortPeers.bind(this), this.cycle * 360)

    // todo: 什么时候算 ready 了？这里是自己本身被监听了，其他都执行了，其他节点也都执行了，但成本与否并未确定 imfly 20240630
    this.ready = true
  }

  /**
   * listen to other peers connect event
   */
  listen () {
    const self = this
    self._server = net.createServer()
    self._server.listen(
      {
        port: this.port,
        host: '0.0.0.0'
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
  async connect (port, host, proxy) {
    const self = this
    return new Promise((resolve, reject) => {
      const peer = new Peer({ host, port })
      if (peer.id === self.id) {
        this.logger.warn(`Should not connect self: ${host}:${port}`)
        reject(new Error(`Should not connect to self: ${host}:${port}`))
        return
      }
      if (self.pool.has(peer.id)) {
        resolve(self.pool.get(peer.id))
        return
      }
      // if(this.pool.size >= this.maxConnectSize) {
      //   this.logger.debug(`pool is up to maxConnectSize: ${this.maxConnectSize} `)
      //   reject(`pool is up to maxConnectSize: ${this.maxConnectSize} `)
      // }
      // create a tcp connect
      const pipe = self._createPipe({ proxy })

      pipe.open(port, host, err => {
        if (err) {
          const errMsg = err.errno === 'ECONNREFUSED' ? 'ECONNREFUSED' : err.message
          self.logger.warn(`connect to ${host}:${port} error: `, errMsg)
          self.inventory.disable(peer.id)
          reject(err)
          return
        }
        self._addPipe(pipe, peer)
        resolve(pipe)
      })
    })
  }

  _delPipe (pipe) {
    if (!pipe.id) return
    this.pool.delete(pipe.id)
    this.inventory.disable(pipe.id)
    this.logger.debug(`success remove pipe from pool: ${pipe.id}`)
  }

  _addPipe (pipe, peer) {
    pipe.id = peer.id
    pipe.host = peer.host
    pipe.port = peer.port
    this.pool.set(pipe.id, pipe)
    this.inventory.add(peer)

    this.logger.debug(
      `${this.port} success connect to peer: ${peer.host}:${peer.port} socket: ${pipe.socket.remotePort}`
    )
  }

  /**
   * private method, add the connection to pool
   * @param {*} socket
   * @returns
   */
  _createPipe (options) {
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
   * Delegate the close server method to backend.
   *
   * @param callback
   */
  close (callback) {
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
   * answer to the peer requesting
   * @param {*} data
   */
  _response (pipe, data, serial) {
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
  async _request (method, api, data, node) {
    try {
      const peer = await this.getPeer(node)
      if (!peer) {
        this.logger.warn('Not found valid peer', node)
        return
        // throw new Error('Not found valid peer')
      }

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
      const pipe = await this.connect(port, host)
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
      const errMsg = err.errno === 'ECONNREFUSED' ? 'ECONNREFUSED' : err.message
      this.logger.warn('request data error: ', errMsg)
      throw err
    }
  }

  async _callApi (msg, peer) {
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
  async _processMessage (msg, pipe) {
    let peer = this.inventory.get(pipe.id)
    if (!peer || peer.status === Peer.STATUS.disable) {
      this.inventory.addMap(pipe.id)
      peer = this.inventory.get(pipe.id)
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
        const { id, version, nethash, host, port, family } = this
        const info = { id, version, nethash, host, port, family }
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
   * GET method request data from peer
   * @param {*} api
   * @param {*} params
   * @param {*} node
   * @returns
   */
  async get (api, params, node) {
    return await this._request(Message.commands.GET, api, params, node)
  }

  /**
   * POST method request data from peer
   * @param {*} api
   * @param {*} data
   * @param {*} node
   * @returns
   */
  async post (api, data, node) {
    return await this._request(Message.commands.POST, api, data, node)
  }

  /**
   * PUT method request data from peer
   * @param {*} api
   * @param {*} data
   * @param {*} node
   * @returns
   */
  async put (api, data, node) {
    return await this._request(Message.commands.PUT, api, data, node)
  }

  /**
   * DELETE method request data from peer
   * @param {*} api
   * @param {*} params
   * @param {*} node
   * @returns
   */
  async delete (api, params, node) {
    return await this._request(Message.commands.DELETE, api, params, node)
  }

  /**
   * broadcast data to all connected peer
   * @param {*} api
   * @param {*} data
   */
  broadcast (api, data, signature) {
    if (typeof api === 'object') {
      data = api.data
      api = api.api
    }
    if (!api || !data) return
    const self = this
    const { type, checksum, size, payload } = Message.getMetadata(data)
    const key = signature || checksum
    const fib = this.fib.get(key) || [this.id]
    const peers = this.inventory.getNextHop(fib, 11)
    fib.push(...peers.map(peer => peer.id))
    peers.forEach(async peer => {
      try {
        if (self.id === peer.id) return
        if (!self.pool.has(peer.id)) {
          await self.connect(peer.port, peer.host)
        }

        const pipe = self.pool.get(peer.id)
        pipe.send(Message.commands.PUSH, payload, { fib, api, type, checksum, size, signature })
      } catch (err) {
        self.logger.error('broadcast data failed', err)
        throw err
      }
    })
  }

  /**
   * get a random pipe
   * @returns pipe
   */
  async getPeer (node) {
    self.logger.warn('getPeer ................', typeof node)
    return !node ? this.inventory.getRandomPeer() : node
  }

  /**
   * discover peer from any a peer
   */
  async _discover () {
    try {
      const peer = this.inventory.getRandomPeer()

      if (!peer || this.id === peer.id) return
      if (!this.pool.has(peer.id)) {
        await this.connect(peer.port, peer.host)
      }

      const pipe = this.pool.get(peer.id)
      const res = await pipe.request(Message.commands.INVENTORY)
      const peers = res && res.data
      if (peers) {
        const self = this
        peers.forEach(item => {
          const newPeer = new Peer(item)
          if (newPeer.id === self.id) return
          self.inventory.add(newPeer)
        })
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
  async _sortPeers () {
    try {
      const self = this
      const peers = this.inventory.getAllPeers()

      peers.map(async peer => {
        if (!this.pool.has(peer.id)) {
          try {
            await this.connect(peer.port, peer.host)
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
