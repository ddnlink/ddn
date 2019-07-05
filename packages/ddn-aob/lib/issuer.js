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
                minLen: 1,
                maxLen: 4096,
                required: true
            },
        ];
    }

    async calculateFee() {
        return bignum.multiply(100, this.tokenSetting.fixedPoint);
    }

    async verify(trs, sender) {
        // 先调用基类的验证
        const trans = await super.verify(trs, sender);

        const issuerObj = await this.getAssetObject(trs);
        // 验证是否存在重复数据
        const data1 = await this.queryAsset({
            name: issuerObj.name
        }, null, null, 1, 1);
        const data2 = await this.queryAsset({
            issuer_id: trs.sender_id,
        }, null, null, 1, 1);
        const results = data1.concat(data2);
        if (results && results.length > 0) {
            throw new Error('Issuer name/issuer_id already exists');
        } else {
            return trans;
        }
    }

    async dbSave(trs, dbTrans) {
        const issuerObj = await this.getAssetObject(trs);
        issuerObj.issuer_id = trs.sender_id;
        await super.dbSave(trs, dbTrans);
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
    }

    async getList(req) {
        // 确定页数相关
        const pageIndex = req.query.pageindex || 1;
        const pageSize = req.query.pagesize || 50;
        const result = await this.queryAsset(null, null, true, pageIndex, pageSize);
        return { success: true, result };
    }

    async getOneByName(req) {
        const name = req.params.name;
        const data = await this.queryAsset({ name }, null, false, 1, 1);
        return { success: true, result: data[0] };
    }

    async onBlockchainReady() {
        await new Promise((resolve, reject) => {
            this.dao.findList("mem_asset_balance", null, null, null,
                (err, rows) => {
                    if (err) {
                        return reject(err);
                    }

                    if (rows && rows.length) {
                        for (var i = 0; i < rows.length; i++) {
                            const row = rows[i];
                            try
                            {
                                this.balanceCache.setAssetBalance(row.address, row.currency, row.balance);
                            }
                            catch (err2)
                            {
                                return reject(err2);
                            }
                        }
                    }

                    resolve();
                });
        });
    }

}

module.exports = Issuer;
