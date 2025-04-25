/*
 * @Author: imfly
 * @Email: kubying@foxmail.com
 * @Date: 2024-06-29 23:08:40
 * @Last Modified by:   imfly
 * @Last Modified time: 2025-01-06 17:28:52
 * @Description: Peer of DDN, responsible for communication and data synchronization between nodes,
 * including p2p network communication, block synchronization, transaction synchronization, account
 * synchronization, etc.
 */

import path from 'path'
import { P2P } from '@ddn/p2p'
import Router from './peer-router'
import { BlockSync, TransactionSync, SignatureSync } from './peer-sync'
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
    
    // 添加初始化标志
    this._prepared = false

    this._peerUpdateTimes = []
    this._peerUpdatings = []
    this.router = new Router(context)

    const { nethash, peers, p2pPort, port, publicIp, version } = this.ctx.config

    // 创建本节点的完整配置
    const p2pConfig = {
      // 基本配置
      port: p2pPort,
      httpPort: port,
      host: publicIp,
      nethash,
      version,

      // 处理 seeds（peers.list），确保每个节点都是完整的 peer 对象
      seeds: peers.list.map(peer => ({
        // 保留原有属性
        ...peer,

        // 确保关键属性存在
        ip: peer.ip || peer.host,
        host: peer.host || peer.ip,
        port: peer.port,

        // 如果没有 httpPort，计算一个默认值
        httpPort: peer.httpPort || String(Number(peer.port) - 1000)
      })),

      // 其他配置
      dbfile: path.join(this.ctx.baseDir, '/db/peer.db'),
      routes: this.router.routes,
      logger: this.logger
    };

    // 创建 P2P 实例
    this.p2p = new P2P(p2pConfig)

    this.broadcast = PeerBroadcast.singleton(this.ctx)
  }

  async prepare() {
    // 检查是否已经初始化过
    if (this._prepared) {
      this.ctx.logger.debug('Peer network already prepared, skipping...')
      return true
    }
    
    this.ctx.logger.info('Preparing peer network...')
    
    try {
      // 确保P2P实例已准备就绪
      await this.p2p.prepare()
      
      // 添加一个延迟，确保节点服务完全启动
      await new Promise(resolve => setTimeout(resolve, 5000))
      
      // 标记为已初始化
      this._prepared = true
      
      this.ctx.logger.info('Peer network prepared successfully')
      return true
    } catch (err) {
      this.ctx.logger.error(`Failed to prepare peer network: ${err.message}`)
      // 即使准备失败，也返回true，确保程序继续运行
      return true
    }
  }

  // TODO: this.running.peer.getVersion() -> this.running.peer.version()
  async version () {
    return this.config.version
  }

  async getPeers () {
    return this.p2p.inventory.getHealthyPeers()
  }

  /**
   * get a random pipe
   * @returns pipe
   */
  async getPeer(id) {
    try {
      return !id ? this.p2p.inventory.getRandomPeer() : this.p2p.inventory.get(id)
    } catch (err) {
      this.ctx.logger.error(`Failed to get peer: ${err.message}`)
      return null
    }
  }

  /**
   * 从随机节点同步区块数据
   */
  async syncBlocks() {
    try {
      return await BlockSync.singleton(this.ctx).syncBlockData()
    } catch (err) {
      this.ctx.logger.error(`Failed to sync blocks: ${err.message}`)
      // 同步失败不应该影响程序运行
      return false
    }
  }

  /**
   * 从指定节点的某个高度同步区块数据
   */
  async syncBlocksFromPeer(peer, fromHeight) {
    try {
      return await BlockSync.singleton(this.ctx)._cloneBlocksFromPeer(peer, fromHeight)
    } catch (err) {
      this.ctx.logger.error(`Failed to sync blocks from peer ${peer.host}:${peer.port}: ${err.message}`)
      return false
    }
  }

  async syncSignatures () {
    return await SignatureSync.singleton(this.ctx).syncSignatures()
  }

  /**
   * 从随机节点同步未确认交易
   */
  async syncUnconfirmedTransactions () {
    return await TransactionSync.singleton(this.ctx).syncUnconfirmedTransactions()
  }

  /**
   * 获取当前活跃连接数
   * @returns {number} 活跃连接数
   */
  async getActiveConnectionCount () {
    try {
      const peers = await this.getPeers()
      return peers ? peers.length : 0
    } catch (err) {
      this.logger.error(`获取活跃连接数失败: ${err.message}`)
      return 0
    }
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
