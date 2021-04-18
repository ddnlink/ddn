/**
 * Peer
 * wangxm   2019-01-14
 */
import _ from 'lodash'

import ip from 'ip'
import PeerInvoker from './peer-invoker'
import PeerSync from './peer-sync'
import PeerBroadcast from './peer-broadcast'

let _singleton

class Peer {
  static singleton (context) {
    if (!_singleton) {
      _singleton = new Peer(context)
    }
    return _singleton
  }

  constructor (context) {
    Object.assign(this, context)
    this._context = context

    this._peerUpdateTimes = []
    this._peerUpdatings = []

    this.broadcast = PeerBroadcast.singleton(this._context)
  }

  async prepare () {
    const peers = this.config.peers.list

    for (let i = 0; i < peers.length; i++) {
      const peer = peers[i]

      const result = await this.dao.findOne('peer', { where: { ip: ip.toLong(peer.ip), port: peer.port } })
      if (!result) {
        await this.dao.insertOrUpdate('peer', { ip: ip.toLong(peer.ip), port: peer.port, state: 2 })
      }
    }

    const count = await this.dao.count('peer')
    if (count) {
      await this.syncPeersList()
      this.logger.info(`Peers ready, stored ${count}`)
    } else {
      this.logger.warn('Peers list is empty')
    }
  }

  // FIXME: delete this function, use the follow version()
  async getVersion () {
    return {
      version: this.config.version,
      build: this.config.buildVersion,
      net: this.config.net
    }
  }

  // TODO: this.running.peer.getVersion() -> this.running.peer.version()
  async version () {
    return this.config.version
  }

  async addDapp ({ ip: configIp, port, dappId }) {
    const data = await this.dao.findOne('peer', { where: { ip:ip.toLong(configIp) , port: port } })
    if (!data) {
      throw new Error(`Peer not found: ${configIp}`)
    }
    const data2 = await this.dao.findOne('peers_dapp', { where: { peer_id: data.id } })

    if (!data2) {
      return await this.dao.insert('peers_dapp', { peer_id: data.id, dapp_id: dappId })
    }
    return data2
  }

  async update ({ ip: peerIp, port, dappId, os = null, version = null, state = 1 }) {
    if (peerIp && port) {
      // dappId = dappId

      if (this.config.publicIp) {
        const localIp = ip.toLong(this.config.publicIp)
        if (localIp === peerIp && this.config.port === port) {
          return
        }
      }

      const peerData = {
        ip: peerIp,
        port: port,
        os: os || null,
        version: version || null,
        state: state || 1
      }

      const peerKey = `${peerIp}_${port}`

      let needUpdateToDB = true
      if (this._peerUpdateTimes.length >= 0) {
        if (this._peerUpdateTimes[peerKey]) {
          if (new Date().getTime() - this._peerUpdateTimes[peerKey] > 1000 * 29) {
            needUpdateToDB = true
          } else {
            needUpdateToDB = false
          }
        }
      } else {
        needUpdateToDB = true
      }

      if (needUpdateToDB && !this._peerUpdatings[peerKey]) {
        this._peerUpdatings[peerKey] = true
        try {
          const data = await this.dao.findOne('peer', { where: { ip: peerData.ip, port: peerData.port } })
          if (data && data.state === 0) {
            delete peerData.state
          }

          await this.dao.insertOrUpdate('peer', peerData)
          if (dappId) {
            await this.addDapp({
              dappId,
              ip: peerIp,
              port: port
            })
          } else {
            this._peerUpdateTimes[peerKey] = new Date().getTime()
          }

          this._peerUpdatings[peerKey] = false
        } catch (err) {
          this._peerUpdatings[peerKey] = false
        }
      }
    }
  }

  /**
   * 请求节点指定接口（默认随机节点，也可指定args.peer来使用指定节点）
   * @param {*} args
   * @param {*} dappId
   * @param {*} allowSelf
   */
  async request (args, dappId, allowSelf, cb) {
    if (typeof cb === 'function') {
      try {
        const data = await PeerInvoker.singleton(this._context).invoke(args, dappId, allowSelf)
        return cb(null, data)
      } catch (error) {
        cb(error)
      }
    }
    return await PeerInvoker.singleton(this._context).invoke(args, dappId, allowSelf)
  }

  /**
   * 从其他节点同步节点列表
   */
  async syncPeersList () {
    let data
    try {
      data = await this.request({
        api: '/all',
        method: 'GET'
      })
    } catch (err) {
      this.logger.error(`Sync PeerList has error: ${err}`)
      return
    }

    if (data && data.body && data.body.peers && data.body.peers.length) {
      const peers = data.body.peers
      for (let i = 0; i < peers.length; i++) {
        const peer = peers[i]
        const validateErrors = await this.ddnSchema.validatePeer(peer)
        if (validateErrors) {
          this.logger.error(`Invalid peer: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`)
          continue
        }

        peer.ip = parseInt(peer.ip)

        if (isNaN(peer.ip)) {
          continue
        }

        if (ip.toLong('127.0.0.1') === peer.ip || peer.port === 0 || peer.port > 65535) {
          continue
        }

        if (await this.isCompatible(peer.version)) {
          await this.update(peer)
        }
      }
    }
  }

  /**
   * 从随机节点同步区块数据
   */
  async syncBlocks () {
    return await PeerSync.singleton(this._context).trySyncBlockData()
  }

  async syncSignatures () {
    return await PeerSync.singleton(this._context).trySyncSignatures()
  }

  /**
   * 从随机节点同步未确认交易
   */
  async syncUnconfirmedTransactions () {
    return await PeerSync.singleton(this._context).trySyncUnconfirmedTransactions()
  }

  async isCompatible (version) {
    const nums = `${version}`.split('.').map(Number)
    if (nums.length !== 3) {
      return true
    }

    const compatibleVersion = this.constants.net.compatibleVersion

    const numsCompatible = compatibleVersion.split('.').map(Number)
    for (let i = 0; i < nums.length; ++i) {
      if (nums[i] < numsCompatible[i]) {
        return false
      } else if (nums[i] > numsCompatible[i]) {
        return true
      }
    }
    return true
  }

  async remove (pip, port) {
    const isStaticPeer = this.config.peers.list.find(peer => peer.ip === ip.fromLong(pip) && peer.port === port)
    if (isStaticPeer) {
      this.logger.info("Peer in white list, can't remove.")
    } else {
      try {
        return await this.dao.remove('peer', { where: { ip: pip, port } })
      } catch (err) {
        this.logger.error(`remove peer: ${err}`)
        throw err
      }
    }
  }

  /**
   * 恢复暂停的节点服务状态为可用（已达到暂停时间的）
   */
  async restoreBanState () {
    try {
      await this.dao.update('peer', { state: 1, clock: null }, { where: { state: 0, clock: { $lt: Date.now() } } })
      return true
    } catch (err) {
      return false
    }
  }

  /**
   * 修改指定节点服务的状态
   * @param {*} pip 节点IP
   * @param {*} port 服务端口
   * @param {*} state 状态（0：停用，1：可用，2：健康）
   * @param {*} timeoutSeconds 服务暂停时间（单位：秒）
   */
  async changeState (pip, port, state, timeoutSeconds) {
    // FIXME: 2020.9.3 白名单状态修改
    // const isStaticPeer = this.config.peers.list.find(
    //   peer => peerIp === ip.fromLong(pip) && peer.port === port
    // )
    // if (false) {
    // if (isStaticPeer) {
    // this.logger.info("Peer in white list, the state can't change.")
    // } else {
    let clock = null
    if (state === 0) {
      clock = Date.now() + (timeoutSeconds || 1) * 1000
    }

    this.logger.debug('Peer is changeState: clock', clock)
    try {
      return await this.dao.update('peer', { state, clock }, { where: { ip: pip, port } })
    } catch (err) {
      this.logger.error('Peer#state', err)
      throw err
    }
    // }
  }

  /**
   * 重置所有节点服务状态为健康
   */
  async reset () {
    try {
      return await this.dao.update('peer', { state: 2 })
    } catch (err) {
      this.logger.error(`Failed to reset peers: ${err}`)
      throw err
    }
  }

  async getRandomPeer (dappId, allowSelf) {
    const peers = await this.queryList(dappId, { state: { $gt: 0 } }, 2)
    if (peers && peers.length) {
      const peer = peers[0]
      const peerIp = ip.fromLong(peer.ip)
      if ((peerIp === '127.0.0.1' || peerIp === this.config.publicIp) && peer.port === this.config.port && !allowSelf) {
        if (peers.length > 1) {
          return peers[1]
        } else {
          await this.reset()
          this.logger.warn('single none does not need sychronization.')

          return null
        }
      } else {
        return peer
      }
    } else {
      await this.reset()
      this.logger.warn('No peers in db')

      return null
    }
  }

  async queryDappPeers () {
    const data = await this.dao.findList('peers_dapp')

    const where = {
      id: {
        $in: _.map(data, 'peer_id')
      }
    }
    return await this.dao.findList('peer', { where })
  }

  async queryList (dappId, where, limit) {
    let data = null

    if (dappId) {
      data = await this.dao.findList('peers_dapp', {
        where: {
          dapp_id: dappId
        },
        limit: limit || this.constants.delegates
      })
    }

    where = where || {}
    if (data) {
      where.id = { $in: _.map(data, 'peer_id') }
    }

    return await this.dao.findList('peer', {
      where,
      limit: limit || this.constants.delegates,
      order: [[this.dao.db_fnRandom()]]
    })
  }

  // Sidechains
  sandboxApi (call, args, cb) {
    // sandboxHelper.callMethod(shared, call, args, cb)
    if (typeof this[call] !== 'function') {
      return cb(`Function not found in module: ${call}`)
    }
    const callArgs = [args.body, args.dappId, true, cb]
    return this[call].apply(this, callArgs)
  }
}

export default Peer
