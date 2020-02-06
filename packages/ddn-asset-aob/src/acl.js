import { AssetBase } from '@ddn/ddn-asset-base';
import ByteBuffer from 'bytebuffer';
import { Bignum } from '@ddn/ddn-utils';
import ddnUtils from '@ddn/ddn-utils';

class Acl extends AssetBase {
    async propsMapping() {
        return [
            {field: 'str1', prop: 'currency', required: true},
            {field: 'int1', prop: 'flag', minValue: 0, maxValue: 1, required: true},
            {field: 'str2', prop: 'operator', minLen: 1, maxLen: 1, required: true},
            {field: 'str10', prop: 'list', required: true}
        ];
    }

    async getBytes(trs) {
        const aclObj = await this.getAssetObject(trs);

        const bb = new ByteBuffer();
        bb.writeString(aclObj.currency);
        bb.writeString(aclObj.operator);
        bb.writeByte(aclObj.flag);
        // for (let i = 0; i < aclObj.list.length; ++i) {
        //     bb.writeString(aclObj.list[i]);
        // }
        if (aclObj.list)
        {
            bb.writeString(aclObj.list);
        }
        bb.flip();

        return bb.toBuffer()
    }

    async verify(trs, sender) {
        if (trs.recipient_id) {
            throw new Error("Invalid recipient")
        }

        if (!Bignum.isZero(trs.amount)) {
            throw new Error("Invalid transaction amount")
        }

        const aclObj = await this.getAssetObject(trs);

        if (['+', '-'].indexOf(aclObj.operator) == -1) {
            throw new Error('Invalid acl operator')
        }

        if ([0, 1, 2].indexOf(aclObj.flag) == -1) {
            throw new Error("Invalid acl flag");
        }

        const listArr = aclObj.list ? aclObj.list.split(',') : [];
        if (listArr.length <= 0 || listArr.length > 10) {
            throw new Error("Invalid acl list");
        }

        const duplicateCheckObj = {};
        for (var i = 0; i < listArr.length; i++) {
            const listItem = listArr[i];
            if (sender.address == listItem) {
                throw new Error("Issuer should not be in ACL list");
            }
            if (!ddnUtils.Address.isAddress(listItem)) {
                throw new Error("Acl contains invalid address");
            }
            if (duplicateCheckObj[listItem]) {
                throw new Error(`Duplicated acl address: ${listItem}`);
            }
            duplicateCheckObj[listItem] = true;
        }

        const assetInst = await this.getAssetInstanceByName("AobAsset");
        const queryResult = await assetInst.queryAsset({currency: aclObj.currency}, null, false, 1, 1);
        if (queryResult.length <= 0) {
            throw new Error(`AOB Asset not found: ${aclObj.currency}`);
        }

        // FIXME: return queryResult[0];
        // const assetInfo = queryResult[0];
    }

    async applyUnconfirmed(trs, sender, dbTrans) {
        const aclObj = await this.getAssetObject(trs);
        const key = `aob:acl:${aclObj.currency}:${trs.type}`;
        if (this.oneoff.has(key)) {
            throw new Error("Double submit");
        }

        this.oneoff.set(key, true)
    }

    async undoUnconfirmed(trs, sender, dbTrans) {
        const aclObj = await this.getAssetObject(trs);
        const key = `aob:acl:${aclObj.currency}:${trs.type}`;
        this.oneoff.delete(key);
    }

    async _insertItem(modelName, currency, item, trans) {
        return new Promise((resolve, reject) => {
            this.dao.insertOrUpdate(modelName, {
                currency,
                address: item
            }, trans, (err) => {
                if (err) {
                    return reject(err);
                }
                resolve(true); // resolve(result)
            })
        });
    }

    // FIXME: delete async
    async _insertList(modelName, currency, list, trans) {
        return new Promise(
            async(resolve, reject) => {
            for (var i = 0; i < list.length; i++) {
                const item = list[i];
                try {
                    await this._insertItem(modelName, currency, item, trans);
                } catch (err) {
                    return reject(err);
                }
            }
            resolve(true);
        });
    }

    async _addList(modelName, currency, list, dbTrans) {
        if (!dbTrans) {
            const self = this;
            await new Promise(async(resolve, reject) => {
                this.dao.transaction(async (trans, done) => {
                    try
                    {
                        await self._insertList(modelName, currency, list, trans);
                        done();
                    }
                    catch (err2)
                    {
                        done(err2);
                    }
                }, err => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(true);
                })
            });
        } else {
            await this._insertList(modelName, currency, list, dbTrans);
        }
    }

    async _removeList(modelName, currency, list, dbTrans) {
        return new Promise((resolve, reject) => {
            this.dao.remove(modelName, {
                currency,
                address: {
                    "$in": list
                }
            }, dbTrans, (err) => {
                if (err) {
                    return reject(err);
                }
                resolve(true);
            });
        });
    }

    async apply(trs, block, sender, dbTrans) {
        const aclObj = await this.getAssetObject(trs);
        const modelName = aclObj.flag == 0 ? "acl_black" : "acl_white";

        const listArr = aclObj.list ? aclObj.list.split(',') : [];
        if (aclObj.operator == "+") {
            await this._addList(modelName, aclObj.currency, listArr, dbTrans);
        } else if (aclObj.operator == "-") {
            await this._removeList(modelName, aclObj.currency, listArr, dbTrans);
        }
        return trs;
    }

    async undo(trs, block, sender, dbTrans) {
        const aclObj = await this.getAssetObject(trs);
        const modelName = aclObj.flag == 0 ? "acl_black" : "acl_white";

        const listArr = aclObj.list ? aclObj.list.split(',') : [];
        if (aclObj.operator == "+") {
            await this._removeList(modelName, aclObj.currency, listArr, dbTrans);
        } else if (aclObj.operator == "-") {
            await this._addList(modelName, aclObj.currency, listArr, dbTrans);
        }
        return trs;
    }

}

export default Acl;