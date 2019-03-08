var { AssetBase } = require('ddn-asset-base');

class AssetEvidence extends AssetBase
{
    async propsMapping() {
        return [
            {field: "str4", prop: "ipid", required: true},
            {field: "str6", prop: "title", required: true},
            {field: "str8", prop: "description"},
            {field: "str7", prop: "hash", required: true},
            {field: "str5", prop: "tags"},
            {field: "str3", prop: "author", required: true},
            {field: "str9", prop: "url", required: true},
            {field: "str1", prop: "type", required: true},
            {field: "str2", prop: "size"}
        ];
    }

    async verify(trs, sender)
    {
        var trans = await super.verify(trs, sender);

        var results = await super.queryAsset({
            ipid: trans.asset.assetEvidence.ipid
        }, ["ipid"], false, 1, 1);
        if (results && results.length > 0) {
            throw new Error('Evidence IPID already exists');
        } else {
            return trans;
        }
    }
}

module.exports = AssetEvidence;