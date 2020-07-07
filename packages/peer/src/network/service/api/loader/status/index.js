import DdnUtils from '@ddn/utils'

/**
 * RootRouter接口
 * wangxm   2019-03-21
 */
class RootRouter {
  constructor (context) {
    Object.assign(this, context)
    this._context = context
  }

  async get (req) {
    const count = await this.runtime.block.getCount()

    return {
      success: true,
      loaded: this.runtime.state === DdnUtils.runtimeState.Ready,
      now: this.runtime.block.getLastBlock().height,
      blocksCount: count
    }
  }

  async getSync (req) {
    const remotePeerHeight = await this.runtime.peer.request({ api: '/height' })
    let blocks = 0

    // 本地服务不需要同步，块等于最新块高
    if (remotePeerHeight) {
      blocks = remotePeerHeight.body.height
    }

    return {
      success: true,
      syncing: this.runtime.state !== DdnUtils.runtimeState.Ready,
      blocks: blocks,
      height: this.runtime.block.getLastBlock().height
    }
  }
}

export default RootRouter
