/* eslint-disable class-methods-use-this */
const {
  AssetBase,
} = require('ddn-asset-base');
const assert = require('assert');
const bignum = require('bignum-utils');
const ddnUtils = require('ddn-utils');
const flagsHelper = require('./flagsHelper');


class Asset extends AssetBase {
  // eslint-disable-next-line class-methods-use-this
  async propsMapping() {
    return [
      {
        field: 'str1',
        prop: 'name',
        required: true,
      },
      {
        field: 'str9',
        prop: 'desc',
      },
      {
        field: 'str2',
        prop: 'maximum',
      },
      {
        field: 'str3',
        prop: 'quantity',
      },
      {
        field: 'str4',
        prop: 'issuer_name',
      },
      {
        field: 'str10',
        prop: 'strategy',
      },
      {
        field: 'int1',
        prop: 'precision',
      },
      {
        field: 'int2',
        prop: 'acl',
      },
      {
        field: 'int3',
        prop: 'writeoff',
      },
      {
        field: 'str5',
        prop: 'allow_writeoff',
      },
      {
        field: 'str6',
        prop: 'allow_whitelist',
      },
      {
        field: 'str7',
        prop: 'allow_blacklist',
      },
    ];
  }

  async calculateFee() {
    return bignum.multiply(500, this.tokenSetting.fixedPoint);
  }

  async verify(trs, sender) {
    await super.verify(trs, sender);
    const asset = trs.asset.aobAsset;
    const nameParts = (asset.name || '').split('.');
    if (nameParts.length !== 2) {
      throw new Error('Invalid asset full name form ddn-aob');
    }
    const issuerName = nameParts[0];
    const tokenName = nameParts[1];
    if (!tokenName || !/^[A-Z]{3,6}$/.test(tokenName)) {
      throw new Error('Invalid asset currency name form ddn-aob');
    }
    if (!asset.desc) {
      throw new Error('Invalid asset desc form ddn-aob');
    }
    if (asset.desc.length > 4096) {
      throw new Error('Invalid asset desc size form ddn-aob');
    }
    if (asset.precision > 16 || asset.precision < 0) {
      throw new Error('Invalid asset precision form ddn-aob');
    }
    const error = ddnUtils.Amount.validate(asset.maximum);
    if (error) {
      throw new Error(error);
    }
    if (asset.strategy && asset.strategy.length > 256) {
      throw new Error('Invalid asset strategy size form ddn-aob');
    }
    if (asset.allow_writeoff !== '0' && asset.allow_writeoff !== '1') {
      throw new Error('Asset allowWriteoff is not valid form ddn-aob');
    }
    if (asset.allow_whitelist !== '0' && asset.allow_whitelist !== '1') {
      throw new Error('Asset allowWhitelist is not valid form ddn-aob');
    }
    if (asset.allow_blacklist !== '0' && asset.allow_blacklist !== '1') {
      throw new Error('Asset allowBlacklist is not valid form ddn-aob');
    }
    const assetData = await super.queryAsset({ name: asset.name }, null, null, 1, 1, 61);
    if (assetData && assetData.length > 0) {
      throw new Error('asset->name Double register form ddn-aob');
    }
    const issuerData = await super.queryAsset({ name: issuerName }, null, null, 1, 1, 60);
    if (!issuerData || !issuerData.length > 0) {
      throw new Error('Issuer not exists form ddn-aob');
    }
    if (issuerData[0].issuer_id !== sender.address) {
      throw new Error('Permission not allowed form ddn-aob');
    }
    return null;
  }

  // eslint-disable-next-line class-methods-use-this
  async getBytes(trs) {
    const asset = trs.asset.aobAsset;
    let buffer = Buffer.concat([
      // eslint-disable-next-line
      new Buffer(asset.name, 'utf8'),
      // eslint-disable-next-line
      new Buffer(asset.desc, 'utf8'),
      // eslint-disable-next-line
      new Buffer(asset.maximum, 'utf8'),
      Buffer.from([asset.precision || 0]),
      // eslint-disable-next-line
      new Buffer(asset.strategy || '', 'utf8'),
      Buffer.from([asset.allow_writeoff || '0']),
      Buffer.from([asset.allow_whitelist || '0']),
      Buffer.from([asset.allow_blacklist || '0']),
    ]);

    const { strategy } = trs.asset.aobAsset;
    if (strategy) {
      buffer = Buffer.concat([buffer]);
    }
    return buffer;
  }

  async dbSave(trs, dbTrans) {
    const asset = trs.asset.aobAsset;
    const nameParts = asset.name.split('.');
    assert(nameParts.length === 2);
    const values = {
      issuer_name: nameParts[0],
      quantity: '0',
      name: asset.name,
      desc: asset.desc,
      maximum: asset.maximum,
      precision: asset.precision,
      strategy: asset.strategy,
      allow_writeoff: asset.allow_writeoff || '0',
      allow_whitelist: asset.allow_whitelist || '0',
      allow_blacklist: asset.allow_blacklist || '0',
      acl: 0,
      writeoff: 0,
    };
    const trans = trs;
    trans.asset.aobAsset = values;
    const result = await super.dbSave(trans, dbTrans);
    return result;
  }

  /**
     * 自定义资产Api
     */
  async attachApi(router) {
    router.get('/assets', async (req, res) => {
      try {
        const result = await this.getList(req, res);
        res.json(result);
      } catch (err) {
        res.json({ success: false, error: err.message || err.toString() });
      }
    });

    router.get('/assets/:name', async (req, res) => {
      try {
        const result = await this.getOneByName(req, res);
        res.json(result);
      } catch (err) {
        res.json({ success: false, error: err.message || err.toString() });
      }
    });

    router.get('/assets/:name/acl/:flag', async (req, res) => {
      try {
        const result = await this.getAssetAcl(req, res);
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
    const data = await super.queryAsset({ trs_type: 61 }, null, true, offset, limit);
    return data;
  }

  async getOneByName(req) {
    const { url } = req;
    const name = url.split('/')[2];
    if (!name) {
      return '无效参数 name';
    }
    const data = await super.queryAsset({
      trs_type: 61,
      name,
    }, null, false, 0, 1);
    return data[0];
  }
}

module.exports = Asset;
