/**
 * RootRouter接口
 * wangxm   2019-03-15
 */
class RootRouter {
  constructor (context) {
    Object.assign(this, context)
    this._context = context
  }

  async get (req) {
    return {
      nethash: this.config.nethash,
      tokenName: this.constants.tokenName,
      tokenPrefix: this.constants.tokenPrefix,
      beginDate: this.constants[this.config.net].beginDate
    }
  }
}

module.exports = RootRouter
