/**
 * RootRouter接口
 * wangxm   2019-03-15
 */
class RootRouter {

    constructor(context) {
        Object.assign(this, context);
        this._context = context;
    }

    async get(req) {
        return {
            nethash: this.config.nethash,
            tokenName: this.tokenSetting.tokenName,
            tokenPrefix: this.tokenSetting.tokenPrefix,
            beginDate: this.tokenSetting[this.config.netVersion].beginDate
        };
    }
}

module.exports = RootRouter;