/*
 * @Author: imfly
 * @Email: kubying@foxmail.com
 * @Date: 2024-06-29 23:08:40
 * @Last Modified by:   Someone
 * @Last Modified time: 2024-07-28 18:28:52
 * @Description: Peer of DDN
 */

import path from 'path'
import { P2P } from '@ddn/p2p'
import Router from './peer-router'
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
    this.ctx = context
    this._context = context

    this._peerUpdateTimes = []
    this._peerUpdatings = []
    this.router = new Router(context)

    const { nethash, peers, p2pPort, port, publicIp } = this.ctx.config

    this.p2p = new P2P({
      port: p2pPort,
      httpPort: port,
      host: publicIp,
      nethash,
      seeds: peers.list,
      dbfile: path.join(this.ctx.baseDir, '/db/peer.db'),
      routes: this.router.routes,
      logger: this.logger
    })

    this.broadcast = PeerBroadcast.singleton(this.ctx)
  }

  async prepare () {
    this.p2p.prepare()
  }

  // TODO: this.running.peer.getVersion() -> this.running.peer.version()
  async version () {
    return this.config.version
  }

  /**
   * 从随机节点同步区块数据
   */
  async syncBlocks () {
    return await PeerSync.singleton(this.ctx).trySyncBlockData()
  }

  async syncSignatures () {
    return await PeerSync.singleton(this.ctx).trySyncSignatures()
  }

  /**
   * 从随机节点同步未确认交易
   */
  async syncUnconfirmedTransactions () {
    return await PeerSync.singleton(this.ctx).trySyncUnconfirmedTransactions()
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
