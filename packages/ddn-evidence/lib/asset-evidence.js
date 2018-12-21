var { AssetBase } = require('ddn-asset-base');

class AssetEvidence extends AssetBase
{
    propsMapping() {
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

    verify(trs, sender, cb)
    {
        super.verify(trs, sender, async (err, trans) => {
            if (!err)
            {
                var condition = {
                    filter: {
                        ipid: trans.asset.assetEvidence.ipid
                    }
                }

                try
                {
                    var results = await super.queryAsset({
                            ipid: trans.asset.assetEvidence.ipid
                        }, ["ipid"], false, 1, 1);

                    if (results && results.length > 0) {
                        cb('Evidence IPID already exists');
                    } else {
                        cb(null, trans);
                    }
                }
                catch (err2)
                {
                    cb(err2);
                }
            }
            else
            {
                cb(err);
            }
        })
    }
}

module.exports = AssetEvidence;