const { AssetBase } = require('ddn-asset-base');
const bignum = require('bignum-utils');

class Issuer extends AssetBase {
  // eslint-disable-next-line class-methods-use-this
  async propsMapping() {
    return [
      {
        field: 'str1',
        prop: 'name',
        required: true,
      },
      {
        field: 'str2',
        prop: 'issuer_id',
      },
      {
        field: 'str10',
        prop: 'desc',
      },
    ];
  }

  async calculateFee() {
    return bignum.multiply(100, this.tokenSetting.fixedPoint);
  }

  async verify(trs, sender) {
    // 先调用基类的验证
    const trans = await super.verify(trs, sender);
    // 验证是否存在重复数据
    const data1 = await super.queryAsset({
      name: trans.asset.aobIssuer.name,
    }, null, null, 1, 1);
    const data2 = await super.queryAsset({
      issuer_id: trs.sender_id,
    }, null, null, 1, 1);
    const results = data1.concat(data2);
    if (results && results.length > 0) {
      throw new Error('Evidence name/issuer_id already exists');
    } else {
      return trans;
    }
  }

  /**
     * 自定义资产Api
     */
  async attachApi(router) {
    router.get('/issuers', async (req, res) => {
      try {
        const result = await this.getList(req, res);
        res.json(result);
      } catch (err) {
        res.json({ success: false, error: err.message || err.toString() });
      }
    });
    router.get('/issuers/:name', async (req, res) => {
      try {
        const result = await this.getOneByName(req, res);
        res.json(result);
      } catch (err) {
        res.json({ success: false, error: err.message || err.toString() });
      }
    });
    router.get('/issuers/:name/assets', async (req, res) => {
      try {
        const result = await this.getIssuerAssets(req, res);
        res.json(result);
      } catch (err) {
        res.json({ success: false, error: err.message || err.toString() });
      }
    });
  }

  async getList(req) {
    // 确定页数相关
    const pageIndex = req.query.pageindex || 1;
    const pageSize = req.query.pagesize || 50;
    const limit = pageSize;
    const offset = (pageIndex - 1) * pageSize;
    const data = await super.queryAsset({ trs_type: 60 }, null, true, offset, limit);
    return data;
  }

  async getOneByName(req) {
    const { url } = req;
    const name = url.split('/')[2];
    if (!name) {
      return '无效参数 name';
    }
    const data = await super.queryAsset({
      trs_type: 60,
      name,
    }, null, false, 0, 1);
    return data[0];
  }

  async getIssuerAssets(req) {
    const { url } = req;
    const name = url.split('/')[2];
    if (!name) {
      return '无效参数 name';
    }
    const pageIndex = req.query.pageindex || 1;
    const pageSize = req.query.pagesize || 50;
    const limit = pageSize;
    const offset = (pageIndex - 1) * pageSize;
    const data = await super.queryAsset({
      trs_type: 61,
      issuerName: name,
    }, null, true, offset, limit, 61);
    return data;
  }
}
module.exports = Issuer;
