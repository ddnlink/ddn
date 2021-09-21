/**
 * NetworkRouter接口
 * wangxm   2019-03-15
 */
import { runtimeState } from '@ddn/utils'

class NetworkRouter {
  constructor (context) {
    Object.assign(this, context)
    this._context = context
  }

  async get (req) {
    return {
      success: true,
      nethash: this.config.nethash,
      tokenName: this.constants.tokenName,
      tokenPrefix: this.constants.tokenPrefix,
      beginDate: this.constants.net.beginDate
    }
  }

  async getStatus (req) {
    const count = await this.runtime.block.getCount()

    return {
      success: true,
      ready: this.runtime.state === runtimeState.Ready,
      height: this.runtime.block.getLastBlock().height,
      blocksCount: count
    }
  }

  async getSync (req) {
    const res = await this.runtime.peer.p2p.get('/height')
    let blocks = this.runtime.block.getLastBlock().height

    // 本地服务不需要同步，块等于最新块高
    if (res && res.body) {
      blocks = res.body.height
    }

    return {
      success: true,
      syncing: this.runtime.state !== runtimeState.Ready,
      blocks: blocks,
      height: this.runtime.block.getLastBlock().height
    }
  }
}

export default NetworkRouter
