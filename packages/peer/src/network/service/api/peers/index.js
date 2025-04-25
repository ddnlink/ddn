/* eslint-disable no-prototype-builtins */
import request from 'request'

/**
 * RootRouter接口
 * wangxm   2019-03-21
 */
class RootRouter {
  constructor (context) {
    Object.assign(this, context)
    this.ctx = context
  }

  /**
   * 发送HTTP请求并获取JSON响应
   * @param {string} url - 请求URL
   * @param {Object} options - 请求选项
   * @returns {Promise<Object>} - JSON响应
   * @private
   */
  _fetchJson(url, options = {}) {
    return new Promise((resolve, reject) => {
      request({
        url,
        json: true,
        timeout: options.timeout || 5000,
        method: 'GET'
      }, (err, resp, body) => {
        if (err) return reject(err)
        resolve(body)
      })
    })
  }

  async queryPeers (filter) {
    return this.ctx.runtime.peer.getPeers()
  }

  async get (req) {
    try {
      // 获取健康节点列表
      const healthyPeers = await this.ctx.runtime.peer.getPeers()

      // 获取所有节点的统计信息
      const stats = this.ctx.runtime.peer.p2p.inventory.getStats()

      // 获取所有节点（包括禁用的节点）
      const allPeers = this.ctx.runtime.peer.p2p.inventory.getAllPeers()

      // 获取本地节点信息
      // const localPeer = {
      //   host: this.config.publicIp,
      //   ip: this.config.publicIp,
      //   port: this.config.p2pPort,
      //   httpPort: this.config.port,
      //   family: 0,
      //   status: 2, // 与其他节点保持一致
      //   delay: 0,
      //   failCount: 0,
      //   id: 'self',
      //   version: this.config.version,
      //   build: this.config.buildVersion || this.config.version,
      //   net: this.config.net,
      //   os: process.platform,
      //   state: this.runtime.stateMachine ? this.runtime.stateMachine.state : 'unknown',
      //   height: this.runtime.block ? this.runtime.block.getLastBlock().height : 'unknown',
      //   statusText: 'you', // 标记为本地节点
      //   lastSeen: Date.now(),
      //   transactionPoolSize: this.runtime.transaction && this.runtime.transaction.getUnconfirmedTransactionList ? this.runtime.transaction.getUnconfirmedTransactionList().length : 0,
      //   diskSpace: await this._getDiskSpace(),
      //   memoryUsage: process.memoryUsage(),
      //   uptime: process.uptime()
      // }

      // 获取其他节点的高度信息
      const heightPromises = allPeers.map(async peer => {
        try {
          if (!peer.httpPort) {
            this.ctx.logger.warn(`Peer ${peer.host}:${peer.port} has no httpPort, using default`)
            peer.httpPort = String(Number(peer.port) - 1000) // 默认规则：httpPort = port - 1000
          }

          const url = `http://${peer.host}:${peer.httpPort}/api/blocks/getHeight`
          const data = await this._fetchJson(url, { timeout: 3000 })

          if (data && data.success) {
            return { id: peer.id, height: data.height }
          }
        } catch (err) {
          this.ctx.logger.debug(`Failed to get height for peer ${peer.host}:${peer.httpPort}: ${err.message}`)
        }
        return { id: peer.id, height: 'unknown' }
      })

      // 获取其他节点的状态信息
      const statusPromises = allPeers.map(async peer => {
        try {
          if (!peer.httpPort) {
            return { id: peer.id, state: 'unknown' }
          }

          const url = `http://${peer.host}:${peer.httpPort}/api/network/status`
          const data = await this._fetchJson(url, { timeout: 3000 })

          if (data && data.success) {
            return { id: peer.id, state: data.ready ? 'ready' : 'syncing' }
          }
        } catch (err) {
          this.ctx.logger.debug(`Failed to get status for peer ${peer.host}:${peer.httpPort}: ${err.message}`)
        }
        return { id: peer.id, state: 'unknown' }
      })

      // 获取其他节点的版本信息
      const versionPromises = allPeers.map(async peer => {
        try {
          if (!peer.httpPort) {
            return { id: peer.id, version: 'unknown', os: 'unknown' }
          }

          const url = `http://${peer.host}:${peer.httpPort}/api/peers/version`
          const data = await this._fetchJson(url, { timeout: 3000 })

          if (data && data.success && data.version) {
            return {
              id: peer.id,
              version: data.version.version || 'unknown',
              build: data.version.build || 'unknown',
              net: data.version.net || 'unknown'
            }
          }
        } catch (err) {
          this.ctx.logger.debug(`Failed to get version for peer ${peer.host}:${peer.httpPort}: ${err.message}`)
        }
        return { id: peer.id, version: 'unknown', os: 'unknown' }
      })

      // 并行执行所有请求
      const [heightResults, statusResults, versionResults] = await Promise.all([
        Promise.all(heightPromises),
        Promise.all(statusPromises),
        Promise.all(versionPromises)
      ])

      // 创建结果映射
      const heightMap = new Map(heightResults.map(r => [r.id, r.height]))
      const stateMap = new Map(statusResults.map(r => [r.id, r.state]))
      const versionMap = new Map(versionResults.map(r => [r.id, { version: r.version, build: r.build, net: r.net }]))

      // 增强节点信息
      const enhancedPeers = allPeers.map(peer => {
        // 获取高度、状态和版本信息
        const height = heightMap.get(peer.id) || 'unknown'
        const state = stateMap.get(peer.id) || 'unknown'
        const versionInfo = versionMap.get(peer.id) || { version: 'unknown', build: 'unknown', net: 'unknown' }

        // 基本信息
        const enhancedPeer = {
          ...peer,
          version: versionInfo.version,
          build: versionInfo.build,
          net: versionInfo.net,
          os: process.platform, // 默认使用当前系统的操作系统类型
          state: state,
          height: height,
          statusText: this._getPeerStatusText(peer.status),
          lastSeen: peer.lastSeen || Date.now(),
          delay: peer.delay || 0,
          transactionPoolSize: 'unknown' // 默认值
        }

        return enhancedPeer
      })

      // 添加本地节点到列表开头
      // enhancedPeers.unshift(localPeer)

      // 更新统计信息，包含本地节点
      const updatedStats = {
        ...stats,
        total: (stats.total || 0) + 1, // 增加本地节点
        ready: (stats.ready || 0) + 1 // 本地节点总是就绪的
      }

      this.ctx.logger.debug(`get peers: healthy=${healthyPeers.length}, total=${allPeers.length + 1}`)

      return {
        success: true,
        peers: enhancedPeers,
        stats: updatedStats,
        totalCount: enhancedPeers.length
      }
    } catch (err) {
      this.ctx.logger.error(`Error in peers/get: ${err.message || err}`)
      return {
        success: false,
        error: err.message || err
      }
    }
  }

  /**
   * 获取节点状态的文本描述
   * @private
   */
  _getPeerStatusText(status) {
    const statusMap = {
      0: 'disabled',
      1: 'pending',
      2: 'ready'
    }
    return statusMap[status] || 'unknown'
  }

  /**
   * 获取磁盘空间信息
   * @private
   */
  async _getDiskSpace() {
    try {
      // 在 Node.js 环境中获取磁盘空间信息
      const { execSync } = require('child_process')

      // 根据操作系统选择不同的命令
      let command
      if (process.platform === 'win32') {
        // Windows
        command = 'wmic logicaldisk get size,freespace,caption'
      } else if (process.platform === 'darwin' || process.platform === 'linux') {
        // macOS 或 Linux
        command = 'df -k /'
      } else {
        return { free: 'unknown', total: 'unknown', used: 'unknown' }
      }

      const output = execSync(command).toString()

      // 简单解析输出
      if (process.platform === 'win32') {
        // Windows 解析逻辑
        const lines = output.trim().split('\n')
        if (lines.length > 1) {
          const parts = lines[1].trim().split(/\s+/)
          if (parts.length >= 3) {
            const free = parseInt(parts[1])
            const total = parseInt(parts[0])
            return {
              free: free,
              total: total,
              used: total - free
            }
          }
        }
      } else {
        // macOS/Linux 解析逻辑
        const lines = output.trim().split('\n')
        if (lines.length > 1) {
          const parts = lines[1].trim().split(/\s+/)
          if (parts.length >= 4) {
            const total = parseInt(parts[1]) * 1024
            const used = parseInt(parts[2]) * 1024
            const free = parseInt(parts[3]) * 1024
            return { free, total, used }
          }
        }
      }

      return { free: 'unknown', total: 'unknown', used: 'unknown' }
    } catch (err) {
      this.ctx.logger.error(`Error getting disk space: ${err.message}`)
      return { free: 'unknown', total: 'unknown', used: 'unknown' }
    }
  }

  async getGet (req) {
    const query = Object.assign({}, req.body, req.query)
    // query.port = Number(query.port)

    const validateErrors = await this.ddnSchema.validate(
      {
        type: 'object',
        properties: {
          ip: {
            type: 'string',
            minLength: 1
          },
          port: {
            type: 'integer',
            minimum: 0,
            maximum: 65535
          }
        },
        required: ['ip', 'port']
      },
      query
    )
    if (validateErrors) {
      throw new Error(`Invalid parameters: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`)
    }

    try {
      const peers = await this.ctx.runtime.peer.getPeers()

      const peer = peers.find(item => item.ip === query.ip && item.port === query.port)

      return {
        success: true,
        peer: peer || {}
      }
    } catch (err) {
      return {
        success: false,
        error: err
      }
    }
  }

  /**
   * GET /peers/version
   *
   * 该接口已经修改，原来返回值：
   * {
   *     version: this.config.version,
   *     build: this.config.buildVersion,
   *     net: this.config.net
   * }
   * @param {*} req 需要提供 nethash 参数
   */
  async getVersion (req) {
    return {
      success: true,
      version: {
        version: this.config.version,
        build: this.config.buildVersion,
        net: this.config.net
      }
    }
  }
}

export default RootRouter
