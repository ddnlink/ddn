DDN Evidence
===

交易体创建方法：<br/>
ddnJS.assetPlugin.createPluginAsset(trsType, assetInfo, secret, secondSecret)<br/>
参数：<br/>
&emsp;&emsp;trsType: 创建交易的类型<br/>
&emsp;&emsp;assetInfo: 创建交易的具体内容<br/>
&emsp;&emsp;secret: 账号的密码<br/>
&emsp;&emsp;secondSecret: 二级密码；(可不传)<br/>
返回：<br/>
&emsp;&emsp;创建成功的交易体对象<br/>

## 提交存证数据
```
const evidencee = {
    short_hash: 'short_hash', // 短哈希，哈希截短后的哈希 非必填
    address: 'xx', // 区块链地址 必填
    description: ' has been evidence.', // 描述 非必填
    hash: 'f082022ee664008a1f15d62514811dfd', // 数据哈希
    tags: 'tag', //标签 必填
    author:'author',//作者 必填
    size: '2448kb',  //大小 非必填
    source_address:'source_address', // 原始数据地址 非必填
    type: 'html', //类型 必填
    metadata: 'metadata', // 元数据 非必填
    field: 'str_ext', // 时间 非必填
    field: 'str_ext' // 描述 非必填
  };

  // 其中password是在用户登录的时候记录下来的，secondPassword需要每次让用户输入
  // 可以通过user.secondPublicKey来判断用户是否有二级密码，如果没有，则不必输入，以下几个交易类型类似
  const transaction = await DdnJS.evidence.createEvidence(evidencee, secret, null);
  console.log(JSON.stringify({ transaction }));

  {
    "transaction":{
        "type":20,
        "nethash":"0ab796cd",
        "amount":"0",
        "fee":"10000000",
        "recipientId":null,
        "senderPublicKey":"daeee33def7eef0c7ba06ec66eda7204437ba88ace8f04e4a6aa4d7bfbd18bc1",
        "timestamp":93994165,
        "asset":{
            "evidence":{
               short_hash: 'short_hash', // 短哈希，哈希截短后的哈希 非必填
               address: 'xx', // 区块链地址 必填
               description: ' has been evidence.', // 描述 非必填
               hash: 'f082022ee664008a1f15d62514811dfd', // 数据哈希
               tags: 'tag', //标签 必填
               author:'author',//作者 必填
               size: '2448kb',  //大小 非必填
               source_address:'source_address', // 原始数据地址 非必填
               type: 'html', //类型 必填
               metadata: 'metadata', // 元数据 非必填
               field: 'str_ext', // 时间 非必填
               field: 'str_ext' // 描述 非必填
            }
        },
        "signature":"26bd82046495f3dc4b2ed9d4452aa0f25be2a5a542fc52c5561a34c06dc8e1ebec03f6fcdbca115517d898c319c56cb448b35596e61bdd677adf9dfd4a87350f",
        "id":"0ff3ba6dc2ceab676107f9a6a66c60d9ec17745a8cd53e3f25ff0da6829727da7d2fc6d470d43d85bd13923b7bdfe54bca6d4da97b0ac60ccd5b55b6a11b51b6"
    }
}
```
