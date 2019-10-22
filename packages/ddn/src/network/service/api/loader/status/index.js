var { RuntimeState } = require('@ddn/ddn-utils');

/**
 * RootRouter接口
 * wangxm   2019-03-21
 */
class RootRouter {

    constructor(context) {
        Object.assign(this, context);
        this._context = context;
    }

    async get(req) {
        var count = await this.runtime.block.getCount();

        return {
            loaded: this.runtime.state == RuntimeState.Ready,
            now: this.runtime.block.getLastBlock().height,
            blocksCount: count
        };
    }

    async getSync(req) {
        var remotePeerHeight = await this.runtime.peer.request({api: "/height"});
        return {
            syncing: this.runtime.state != RuntimeState.Ready,
            blocks: remotePeerHeight.body.height,
            height: this.runtime.block.getLastBlock().height
        }
    }

}

module.exports = RootRouter;