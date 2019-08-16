/* eslint-disable class-methods-use-this */
const { AssetBase } = require('@ddn/ddn-asset-base');
const bignum = require('@ddn/bignum-utils');
const ddnUtils = require('@ddn/ddn-utils');
const assert = require('assert');

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
                minLen: 1,
                maxLen: 1024,
                required: true
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

        const asset = await this.getAssetObject(trs);
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
        const assetData = await this.queryAsset({ name: asset.name }, null, null, 1, 1);
        if (assetData && assetData.length > 0) {
            throw new Error('asset->name Double register form ddn-aob');
        }
        const issuerInst = await this.getAssetInstanceByName("AobIssuer");
        const issuerData = await issuerInst.queryAsset({ name: issuerName }, null, null, 1, 1);
        if (!issuerData || !(issuerData && issuerData.length > 0)) {
            throw new Error('Issuer not exists form ddn-aob');
        }
        if (issuerData[0].issuer_id !== sender.address) {
            throw new Error('Permission not allowed form ddn-aob');
        }
        return trs;
    }

    // eslint-disable-next-line class-methods-use-this
    async getBytes(trs) {
        const asset = await this.getAssetObject(trs);
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

        const { strategy } = asset;
        if (strategy) {
            buffer = Buffer.concat([buffer]);
        }
        return buffer;
    }

    async dbSave(trs, dbTrans) {
        const asset = await this.getAssetObject(trs);
        const nameParts = asset.name.split('.');
        assert(nameParts.length == 2)
        asset.issuer_name = nameParts[0];
        asset.quantity = asset.quantity || '0';
        await super.dbSave(trs, dbTrans);
    }

    /**
       * 自定义资产Api
       */
    async attachApi(router) {
        router.get('/list', async (req, res) => {
            try {
                const result = await this.getList(req, res);
                res.json(result);
            } catch (err) {
                res.json({ success: false, error: err.message || err.toString() });
            }
        });

        router.get('/:name', async (req, res) => {
            try {
                const result = await this.getOneByName(req, res);
                res.json(result);
            } catch (err) {
                res.json({ success: false, error: err.message || err.toString() });
            }
        });

        router.get('/:name/acl/:flag', async (req, res) => {
            try {
                const result = await this.getAssetAcl(req, res);
                res.json(result);
            } catch (err) {
                res.json({ success: false, error: err.message || err.toString() });
            }
        });

        router.get('/balances/:address', async (req, res) => { // 127.0.0.1:8001/api/aobasset/balances/:address
            try {
                const result = await this.getBalances(req, res);
                res.json(result);
            } catch (err) {
                res.json({ success: false, error: err.message || err.toString() });
            }
        });
        router.get('/balances/:address/:currency', async (req, res) => { // 127.0.0.1:8001/api/aobasset/balances/:address/:currency
            try {
                const result = await this.getBalance(req, res);
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
        const result = await super.queryAsset(null, null, true, pageIndex, pageSize);
        return { success: true, result };
    }

    async getOneByName(req) {
        const name = req.params.name;
        const data = await this.queryAsset({ name }, null, false, 1, 1);
        return { success: true, result: data[0] };
    }

    async getAssetAcl(req) {
        const name = req.params.name;
        const flag = req.params.flag;
        const table = (flag === '0') ? 'acl_black' : 'acl_white';
        return new Promise((resolve, reject) => {
            this.dao.findList(table, { currency: name }, null, null, null, (err, data) => {
                if (err) {
                    reject(err);
                }

                resolve({ success: true, result: data });
            });
        });
    }

    async getBalances(req) {
        const address = req.params.address;
        return new Promise((resolve, reject) => {
            this.dao.findList('mem_asset_balance', { address }, null, null, null, (err, data) => {
                if (err) {
                    reject(err);
                }

                resolve({ success: true, result: data });
            });
        });
    }

    async getBalance(req) {
        const address = req.params.address;
        const currency = req.params.currency;
        return new Promise((resolve, reject) => {
            this.dao.findOne('mem_asset_balance', { address, currency }, null, null, (err, data) => {
                if (err) {
                    reject(err);
                }

                resolve({ success: true, result: data });
            });
        });
    }

    async getIssuerAssets(req) {
        const name = req.params.name;
        const pageIndex = req.query.pageindex || 1;
        const pageSize = req.query.pagesize || 50;
        const data = await this.queryAsset({
            issuerName: name,
        }, null, true, pageIndex, pageSize);

        return { success: true, result: data };
    }
}

module.exports = Asset;
