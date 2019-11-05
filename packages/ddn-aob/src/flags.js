const { AssetBase } = require('@ddn/ddn-asset-base');
const bignum = require('@ddn/bignum-utils');

class Flags extends AssetBase
{
    
    //flag_type: 1: 设置acl对应值，2：设置writeoff对应值
    async propsMapping() {
        return [
            {field: 'str1', prop: 'currency', required: true},
            {field: 'int1', prop: 'flag', minValue: 0, maxValue: 2, required: true},
            {field: 'int2', prop: 'flag_type', minValue: 1, maxValue: 2, required: true}
        ];
    }

    async verify(trs, sender) {
        await super.verify(trs, sender);

        if (trs.recipient_id) {
            throw new Error("Invalid recipient")
        }
        //bignum update if (trs.amount != 0) 
        if (!bignum.isZero(trs.amount)) {
            throw new Error("Invalid transaction amount")
        }
    
        const flagsObj = await this.getAssetObject(trs);

        const assetInst = await this.getAssetInstanceByName("AobAsset");
        const queryResult = await assetInst.queryAsset({name: flagsObj.currency}, null, false, 1, 1);
        if (queryResult.length <= 0) {
            throw new Error(`AOB Asset not found: ${flagsObj.currency}`);
        }
        const assetInfo = queryResult[0];

        const issuerInst = await this.getAssetInstanceByName("AobIssuer");
        const queryResult2 = await issuerInst.queryAsset({name: assetInfo.issuer_name}, null, false, 1, 1);
        if (queryResult2.length <= 0) {
            throw new Error(`AOB Issuer not found: ${assetInfo.issuer_name}`);
        }
        const issuerInfo = queryResult2[0];

        if (issuerInfo.issuer_id != sender.address) {
            throw new Error("Permission not allowed");
        }
        if (assetInfo.writeoff) {
            throw new Error("Asset already writeoff");
        }
        if (assetInfo.allow_writeoff == "0" && flagsObj.flag_type == 2) {
            throw new Error("Writeoff not allowed");
        }
        if (assetInfo.allow_whitelist == "0" && flagsObj.flag_type == 1 && flagsObj.flag == 1) {
            throw new Error("Whitelist not allowed");
        }
        if (assetInfo.allow_blacklist == "0" && flagsObj.flag_type == 1 && flagsObj.flag == 0) {
            throw new Error("Blacklist not allowed");
        }

        if (flagsObj.flag_type == 1) {  //acl
            if (assetInfo.acl == flagsObj.flag) {
                throw new Error("Flag acl double set");
            }
        } else if (flagsObj.flag_type == 2) {   //writeoff
            if (assetInfo.writeoff == flagsObj.flag) {
                throw new Error("Flag writeoff double set");
            }
        }

        return trs;
    }

    async applyUnconfirmed(trs, sender, dbTrans) {
        const flagsObj = await this.getAssetObject(trs);
        const key = `aob:flags:${flagsObj.currency}:${trs.type}`;
        if (this.oneoff.has(key)) {
            throw new Error("Double submit");
        }

        this.oneoff.set(key, true)
    }

    async undoUnconfirmed(trs, sender, dbTrans) {
        const flagsObj = await this.getAssetObject(trs);
        const key = `aob:flags:${flagsObj.currency}:${trs.type}`;
        this.oneoff.delete(key);
    }

    async apply(trs, block, sender, dbTrans) {
        const flagsObj = await this.getAssetObject(trs);

        var updateObj = {};
        if (flagsObj.flag_type == 1) //acl
        {
            updateObj.acl = flagsObj.flag;
        } else if (flagsObj.flag_type == 2) {   //writeoff
            updateObj.writeoff = flagsObj.flag;
        }

        const assetInst = await this.getAssetInstanceByName("AobAsset");
        await assetInst.update(updateObj, {name: flagsObj.currency}, dbTrans);
    }

    async undo(trs, block, sender, dbTrans) {
        const flagsObj = await this.getAssetObject(trs);

        var updateObj = {};
        if (flagsObj.flag_type == 1) //acl
        {
            updateObj.acl = flagsObj.flag ^ 1;
        } else if (flagsObj.flag_type == 2) {   //writeoff
            updateObj.writeoff = flagsObj.flag ^ 1;
        }

        const assetInst = await this.getAssetInstanceByName("AobAsset");
        await assetInst.update(updateObj, {name: flagsObj.currency}, dbTrans);
    }

}

module.exports = Flags;