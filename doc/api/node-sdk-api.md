---
id: ddn-node-sdk-api
title: DDN Node-SDK Api
sidebar_label: DDN Node-SDK Api
---



## **1 ddn-node-sdk说明**

### **1.0 本文档适合的版本**

除非特殊说明，本文档仅仅适合于 `DDN v3.0.0` 以后的版本，当前最新版本为 `DDN v3.0.0`

### **1.1 安装**

```
npm install @ddn/ddn-node-sdk // 正式开源之后的安装方法，请向官方申请
var DdnJS = require('@ddn/ddn-node-sdk');
```

### **1.2 初始化**
ddn-node-sdk在使用前，必须进行初始化。  

`init(nethash)`

- `nethash` 密码
```
DdnJS.init('0ab796cd')
```

### **1.3 说明**
很多函数都需要传入secret、secondSecret这2个参数，分表代表密码和二级密码，下面章节不再赘述。
自定如下全局变量，用于之后章节代码演示。

- `secret` 密码    
- `publicKey` 公钥    
- `secondSecret` 二级密码

```
> var secret = 'borrow display rebel depart core buzz right distance avocado immense push minor'
> var publicKey = 'ebd4c62ebe2255b7ad5ee43120a9f9191c76e30928c92cd536351e3cc2c626ed';
> var secondSecret = 'helloworldDDN';
```


## **2 账户**  

### **2.1 根据密码获取密钥对**

`crypto.getKeys(secret)`

- `secret` 密码

```
> DdnJS.crypto.getKeys(secret)
{public_key:"0b5cfb77f401c818f7ebf02a0e88d52a28d3e4e24643e8a080c0c20ac45d0b9c",private_key:"ef972c7199f90fcbdfc8e2084f4f49bc23969b5e0c7b91cf48fcd10cf33f3fbc0b5cfb77f401c818f7ebf02a0e88d52a28d3e4e24643e8a080c0c20ac45d0b9c"}
```

### **2.1 根据公钥获取地址**

`crypto.getAddress(publicKey)`

- `publicKey`  公钥

```
> DdnJS.crypto.getAddress(publicKey);
'DLbsdFXJNVa68SCAJxtGMaGdfBWkPALZzJ'

```

### **2.3 设置二级密码，type=1**

`signature.createSignature(secret, secondSecret)`
`备注` 在主链的交易类型为1

- `secret` 密码    
- `secondSecret` 二级密码

```
> DdnJS.signature.createSignature(secret, secondSecret)
{
    type: 1,
    nethash: "0ab796cd",
    amount: "0",
    fee: "500000000",
    recipient_id: null,
    sender_public_key: "0b5cfb77f401c818f7ebf02a0e88d52a28d3e4e24643e8a080c0c20ac45d0b9c",
    timestamp: 55201932,
    asset": {
        signature: {
            public_key: "d1278309b21a361fe43b52b5494a29124555742ec18eb92b7217fe64920e244f"
        }
    },
    signature: "3d0d031df1b014a4b4e953cd8deba43e2258bdfd958e15a06f1200a2255179d8e41aba4850313fe4bbb9dbaffc85b32b6f36b40557a4a96803cbd6a6e16d4f07",
    id: "65bcb122f2f0e58b400b467fa4196f29654b7d6d86267175f6f75dc3f41a1839"
}
```

### **2.4 账户锁仓，type=100**

`transaction.createLock(height, secret, secondSecret)`
`备注` 在主链的交易类型为100

- `height` 锁仓高度
- `secret` 密码
- `secondSecret` 二级密码

```
> DdnJS.transaction.createLock(8130, secret, secondSecret)
{
    type: 100,
    amount: "0",
    nethash: "0ab796cd",
    fee: "10000000",
    recipient_id: null,
    args: ["8130"],
    timestamp: 55202354,
    asset: {},
    sender_public_key: "0b5cfb77f401c818f7ebf02a0e88d52a28d3e4e24643e8a080c0c20ac45d0b9c",
    signature: "b1e0e4b2a4141f242ea0d30b4ab6ffcb50717e918d065d3df88d28965d2546d405b286af9ddf586a737f8d5e8ea1c1b2e5fbe007a6d7ffdb079fa5924be67e03",
    id: "74f9e14ce8e4f39ce521b61dd74c095e55ca07dae75590486aceef10855d07ee"
}
```


## **3 普通交易transactions**  

### **3.1 在主链转账DDN，type=0**

`transaction.createTransaction(recipientId, amount, message, secret, secondSecret)`
`备注` 在主链的交易类型为0

- `recipientId` 接收者地址
- `amount` 转账数量
- `message` 转账附言
- `secret` 密码
- `secondSecret` 二级密码

```
> DdnJS.transaction.createTransaction(targetAddress, amount, message, secret, secondSecret)
{
    type: 0,
    nethash: "0ab796cd",
    amount: "10000000000",
    fee: "10000000",
    recipient_id: "DLbsdFXJNVa68SCAJxtGMaGdfBWkPALZzJ",
    message: "转账测试",
    timestamp: 55202460,
    asset: {},
    sender_public_key: "2e6d978c5e6f1fbfc5a27abd964d9b6adc352daa81e31d9098a4f5ee3d7f885e",
    signature: "149aa2ce067e60cc949e45341ba0cf7f1e4fd8f5658d1e5dce7801eb6d2c10a3e3d13c6a3e0209519e300c9122f952e26ae0a96f70ec7b907c2958a3dcd34f0d",
    id: "14dd631938d158becbbbb48d0e62b3899da87d115d7c60be16a7e2ee7e23783c"
}
```


### **3.2 根据交易内容获取交易id**

`crypto.getId(transaction)`

- `transaction` 签名后的交易内容

```
> transaction = DdnJS.transaction.createTransaction(targetAddress, amount, message, secret, secondSecret)
{
    type: 0,
    nethash: "0ab796cd",
    amount: "1000000000000",
    fee: "10000000",
    recipient_id: "D4FN28d1mfjdUG7rtUzEAstFVzPsmWUm2L",
    message: "",
    timestamp: 55202702,
    asset: {},
    sender_public_key: "0b5cfb77f401c818f7ebf02a0e88d52a28d3e4e24643e8a080c0c20ac45d0b9c",
    signature: "c74bf62d6018c51606e8f4408e2708f35ce62f87f08e2668f394aea159ec32243347b47dfadd88bd3fcbc3a15aaaca53b1beddb13dfb5cdafb1549f52a1c7409",
    id: "d657434ddc9683f96a90ae0f2ef82ec5194f368ab70fef13466350a1d86d8fb6"
}

> await DdnJS.crypto.getId(transaction)  
'd657434ddc9683f96a90ae0f2ef82ec5194f368ab70fef13466350a1d86d8fb6'  // 返回结果，交易id

```


## **4 资产相关AOB**  

### **4.1 资产发行商注册，type=60**

`assetPlugin.createPluginAsset(type, assetInfo, secret, secondSecret)`
```
var issuer = {
    name: "DDD",    // 发行商名称,唯一标识
    desc: "J G V",  // 发行商描述
    issuer_id: "DLbsdFXJNVa68SCAJxtGMaGdfBWkPALZzJ",
    fee: '10000000000',
}
await DdnJS.assetPlugin.createPluginAsset(60, issuer, secret, secondSecret)
{
    type: 60,
    nethash: "0ab796cd",
    amount: "0",
    recipient_id: null,
    sender_public_key: "0b5cfb77f401c818f7ebf02a0e88d52a28d3e4e24643e8a080c0c20ac45d0b9c",
    timestamp: 55102937,
    message: null,
    asset: {
        aobIssuer: {
            name: "DDD",
            desc: "J G V",
            issuer_id: "DLbsdFXJNVa68SCAJxtGMaGdfBWkPALZzJ"
        }
    },
    fee: "10000000000",
    signature: "f8503ee19d2fb1798847cbb66346daf01bf34e0278caa5a9aa51dcd6a7a7081ef45f01ed76518d01169133571f610de1e074a1012d6fd23703a4b35393b0ae0a"
}
```



### **4.2 资产注册，type=61**

`assetPlugin.createPluginAsset(type, assetInfo, secret, secondSecret)`
```
var obj = {
    name: "DDD.NCR",    // 资产名称，发行商名.资产名，唯一标识
    desc: "DDD新币种",
    maximum: "100000000",   // 上限
    precision: 2,   // 精度，小数点的位数，这里上限是1000000，精度为3，代表资产IssuerName.CNY的最大发行量为1000.000
    strategy: '',   // 策略
    allow_blacklist: '1',
    allow_whitelist: '1',
    allow_writeoff: '1',
    fee: '50000000000'
}
await DdnJS.assetPlugin.createPluginAsset(61, obj, secret, secondSecret)
{
    type: 61,
    nethash: "0ab796cd",
    amount: "0",
    recipient_id: null,
    sender_public_key: "0b5cfb77f401c818f7ebf02a0e88d52a28d3e4e24643e8a080c0c20ac45d0b9c",
    timestamp: 55103637,
    message: null,
    asset: {
        aobAsset: {
            name: "DDD.NCR",
            desc: "DDD新币种",
            maximum: "100000000",
            precision: 2,
            strategy: "",
            allow_blacklist: "1",
            allow_whitelist: "1",
            allow_writeoff: "1"
        }
    },
    fee: "50000000000",
    signature: "6a197b7533d6d74bd15d0ffd873db6c841bcd729aec531b5987c02ba94e4c507dd5f085821f10a4dc152c20180b9989303083df1355ac506c0a50f2d0b45da05"
}
```



### **4.3 资产设置访问控制列表(acl)模式，type=62**

`assetPlugin.createPluginAsset(type, assetInfo, secret, secondSecret)`
```
var obj = {
    currency: "DDD.NCR",
    flag: 1,    //flag_type=1（0：使用黑名单，1：使用白名单，2：全开放），flag_type=2（0：流通，1：注销）
    flag_type: 1    //1：黑白名单设置，2：注销设置
}
await DdnJS.assetPlugin.createPluginAsset(62, obj, secret, secondSecret)
{
    type: 62,
    nethash: "0ab796cd",
    amount: "0",
    recipient_id: null,
    sender_public_key: "0b5cfb77f401c818f7ebf02a0e88d52a28d3e4e24643e8a080c0c20ac45d0b9c",
    timestamp: 55104595,
    message: null,
    asset: {
        aobFlags: {
            currency: "DDD.NCR",
            flag: 1,
            flag_type: 1
        }
    },
    fee: "10000000",
    signature: "79dd60164b3acf300dca9f81b0f032114d5c54448d1fee3a0bd43157ae54b54d3307a3c8eeca4f464c49a6a02265b1e3f2d553c48799f94d8f0437d417c0e305"
}
```

### **4.4 更新访问控制列表(acl)，type=63**

`assetPlugin.createPluginAsset(type, assetInfo, secret, secondSecret)`
```
var obj = {
    currency: "DDD.NCR",
    flag: 1,    // 访问控制列表的类型，0：黑名单， 1：白名单
    operator: "+",  // '+'表示增加列表， ‘-’表示删除列表
    list: "DJS57PDiq2srYdL5eqzUt7oAZ4WvEkVT9q"    //黑白名单内容，多个用逗号分隔
}
await DdnJS.assetPlugin.createPluginAsset(63, obj, secret, secondSecret)
{
    type: 63,
    nethash: "0ab796cd",
    amount: "0",
    recipient_id: null,
    sender_public_key: "0b5cfb77f401c818f7ebf02a0e88d52a28d3e4e24643e8a080c0c20ac45d0b9c",
    timestamp: 55105961,
    message: null,
    asset: {
        aobAcl: {
            currency: "DDD.NCR",
            flag: 1,
            operator: "+",
            list: "DJS57PDiq2srYdL5eqzUt7oAZ4WvEkVT9q"
        }
    },
    fee: "10000000",
    signature: "5d81ebd68af2c2e314b9ca2bae99cbd538933325cf4965b510b88319a67c82f901c2a2e234fe220d6d5424c8deddd0f34e6eb5c326e1360e31118a4db64b5e07"
}
```

### **4.5 资产发行，type=64**

`assetPlugin.createPluginAsset(type, assetInfo, secret, secondSecret)`
```
var obj = {
    currency: "DDD.NCR",
    aobAmount: "50000000",  // 本次发行量=真实数量（100）*10**精度（3），所有发行量之和需 <= 上限*精度
    fee: '10000000',
}
await DdnJS.assetPlugin.createPluginAsset(64, obj, secret, secondSecret)
{
    type: 64,
    nethash: "0ab796cd",
    amount: "0",
    recipient_id: null,
    sender_public_key: "0b5cfb77f401c818f7ebf02a0e88d52a28d3e4e24643e8a080c0c20ac45d0b9c",
    timestamp: 55108465,
    message: null,
    asset: {
        aobIssue: {
            currency: "DDD.NCR",
            amount: "50000000"
        }
    },
    fee: "10000000",
    signature: "968df5d4853b0f6f78447dbd4e08f53f27a5825121e0c6f62adda81ee6cca8e602b5c6018a175b06dbe7125e099f200da24e972411246b462ba4b96a54b1b00d"
}
```

### **4.6 资产转账，type=65**

`assetPlugin.createPluginAsset(type, assetInfo, secret, secondSecret)`
```
var obj = {
    recipient_id: "DJS57PDiq2srYdL5eqzUt7oAZ4WvEkVT9q",    // 接收地址，需满足前文定义好的acl规则
    currency: "DDD.NCR",
    aobAmount: "10",    // 本次转账数（10000）=真实数量（10）*10**精度（3），需 <= 当前资产发行总量
    message: '测试转账',
    fee: '0',
}
await DdnJS.assetPlugin.createPluginAsset(65, obj, secret, secondSecret)
{
    type: 65,
    nethash: "0ab796cd",
    amount: "0",
    recipient_id: "DJS57PDiq2srYdL5eqzUt7oAZ4WvEkVT9q",
    sender_public_key: "0b5cfb77f401c818f7ebf02a0e88d52a28d3e4e24643e8a080c0c20ac45d0b9c",
    timestamp: 55108730,
    message: "测试转账",
    asset: {
        aobTransfer: {
            currency: "DDD.NCR",
            amount: "10"
        }
    },
    fee: "10000000",
    signature: "f0e5cb2b832ff662c3da84b5fbb18860da4f6501679e6b2f1009f5dc24c6a75677a0fdc8812c4e9c28fbbe3f1f24b84089f366899811f365791474b5d49b2605"
}
```

### **4.7 资产注销，type=62**

`assetPlugin.createPluginAsset(type, assetInfo, secret, secondSecret)`
```
var obj = {
    currency: "DDD.NCR",
    flag: 1,    //flag_type=1（0：使用黑名单，1：使用白名单，2：全开放），flag_type=2（0：流通，1：注销）
    flag_type: 2    //1：黑白名单设置，2：注销设置
}
await DdnJS.assetPlugin.createPluginAsset(62, obj, secret, secondSecret)
{
    type: 62,
    nethash: "0ab796cd",
    amount: "0",
    recipient_id: null,
    sender_public_key: "0b5cfb77f401c818f7ebf02a0e88d52a28d3e4e24643e8a080c0c20ac45d0b9c",
    timestamp: 55109270,
    message: null,
    asset: {
        aobFlags: {
            currency: "DDD.NCR",
            flag: 1,
            flag_type: 2
        }
    },
    fee: "10000000",
    signature: "5121c6994af989454d00b87773f8df9b974438c1ebc923646a703e2acd8d8f5b856e6ad641aef3edd47f4df818a284984cbbf19c30f61bbfbce07db828dee501"
}
```

## **5 受托人delegate**
### **5.1 注册受托人,type=2**

`delegate.createDelegate(username, secret, secondSecret)`
`备注` 在主链的交易类型为2

- `username` 受托人名字
- `secret` 密码
- `secondSecret` 二级密码

```
> DdnJS.delegate.createDelegate(userName, secret, secondSecret || undefined)
{
    type: 2,
    nethash: "0ab796cd",
    amount: "0",
    fee: "10000000000",
    recipient_id: null,
    sender_public_key: "07ada08c4585cfda5e095ec3796f4fa88c93484113d18b6219aea5511231309c",
    timestamp: 55203864,
    asset: {
        delegate: {
            username: "softwaiter",
            public_key: "07ada08c4585cfda5e095ec3796f4fa88c93484113d18b6219aea5511231309c"
        }
    },
    signature: "b3643b4e4e844ac3a2ce1a69f0fe7805e59d3f8e4914c7ac23348bc5c237891a47418fe0fbd592f007c8f2f5f5d9ec408fd44bcee3f7b4af54fcb2adf5901306",
    id: "271044a649f8e43ee054568987d72f611182b345c18021cd30e8fd586e3135f6"
}
```

### **5.2 给受托人增加/取消投票，type=3**

`vote.createVote(keyList, secret, secondSecret)`
`备注` 在主链的交易类型为3

- `keyList` 受托人公钥列表
- `secret` 密码
- `secondSecret` 二级密码

```
// 投票内容是一个列表，列表中的每一个元素是一个符号加上所选择的受托人的公钥，符号为+表示投票，符号为-表示取消投票
> DdnJS.vote.createVote(voteContent, secret, secondSecret || undefined);
{
    type: 3,
    nethash: "0ab796cd",
    amount: "0",
    fee: "10000000",
    recipient_id: null,
    sender_public_key: "0b5cfb77f401c818f7ebf02a0e88d52a28d3e4e24643e8a080c0c20ac45d0b9c",
    timestamp: 55204126,
    asset: {
        vote: {
            votes: ["+07ada08c4585cfda5e095ec3796f4fa88c93484113d18b6219aea5511231309c"]
        }
    },
    signature: "4113ae3454c02381f83725a6bc3081a4d93ac39c3a1601f79d01aa466c8cc1e3675a48682e379a4797450bec267c7fc50093cb62fb52ae86aef181aa782ea209",
    id: "ef297a4817f95e6a8c53e547a50f3e41c2105b15f20aa304ac5cd78b41671865"
}
```


## **6 dapp相关**

### **6.1 dapp注册，type=11**

`assetPlugin.createPluginAsset(type, assetInfo, secret, secondSecret)`
```
var dapp = {
    name: "dapp_demo",
    description: "This is the first dapp demo.",
    tags: "dapp demo",
    type: 0,
    category: 1,
    icon: "http://ebookchain.org/static/media/logo.5e78d8c2.png",
    link: "http://www.ebookchain.org/dapp-demo.zip",
    delegates: "9fd69aac90c0f37ab307d7b8e98590c50b9f2a7a1ed26363a01fac89a59bdd76,2868146929409e121a092051b4577d51a92e485492acacc16c54f607cc3c097a,16de48938a493de85920505621850e6c3187fccbabe4d67abfca9fae44cb5a9c,396ddd886fb33e00c997ce2cfc090aeaa61afcd6a6628172ab349310bc6897b7,ea0ffd10ac6ef657ea2b4b20df1d9ad2cd46c8bd5cff80ed8cac6fb05b460c60",
    unlock_delegates: 3
};
await DdnJS.assetPlugin.createPluginAsset(11, dapp, secret, secondSecret)
{
    type: 11,
    nethash: "0ab796cd",
    amount: "0",
    recipient_id: null,
    sender_public_key: "2e6d978c5e6f1fbfc5a27abd964d9b6adc352daa81e31d9098a4f5ee3d7f885e",
    timestamp: 55265109,
    message: null,
    asset: {
        dapp: {
            name: "dapp_demo",
            description: "This is the first dapp demo.",
            tags: "dapp demo",
            type: 0,
            category: 1,
            icon: "http://ebookchain.org/static/media/logo.5e78d8c2.png",
            link: "http://www.ebookchain.org/dapp-demo.zip",
            delegates: "07ada08c4585cfda5e095ec3796f4fa88c93484113d18b6219aea5511231309c,f408729dae7e14d5d124f3edb0d2f5d6be3d2342bc2b511f41ed39d54efa416c,668f086f26340882ebbc7d33339b898eb17ea5e6a3c4bbc6d4303ac09127cde3,2623fb0ff610e2a496c6a16e022d5de9264d8b53ca1e79884203daa64a671c58,2f28d4cadf4a2b9fe55265795852e8e20af91598ec2af1be5a4fe148bef596b9",
            unlock_delegates: 3
        }
    },
    fee: "10000000000",
    signature: "61272bdda488f0c5cdfb4f8d2c4b23ee6eacd495a87b31b90be95ce1460b8da5982eb13c05b38b947c1617e39773d1a8d2de7b2e1236b058e941241aa09d6605"
}
```

### **6.2 dapp充值，type=12**

`assetPlugin.createPluginAsset(type, assetInfo, secret, secondSecret)`
```
var obj = {
    dapp_id: "14819b293859529eba5ca7b51cde02b808699fc0b128fd4de94800dc99665a48",
    currency: "DDN",
    amount: "1000000000000"
};
await DdnJS.assetPlugin.createPluginAsset(12, obj, secret, secondSecret)
{
    type: 12,
    nethash: "0ab796cd",
    amount: "1000000000000",
    recipient_id: null,
    sender_public_key: "2e6d978c5e6f1fbfc5a27abd964d9b6adc352daa81e31d9098a4f5ee3d7f885e",
    timestamp: 55265239,
    message: null,
    asset: {
        inTransfer: {
            dapp_id: "14819b293859529eba5ca7b51cde02b808699fc0b128fd4de94800dc99665a48",
            currency: "DDN"
        }
    },
    fee: "10000000",
    signature: "8f4b3d21bfa3bca8c94ca55fafa13ed18c0c38e884261a9212a002a8fc13541b74592dbaf08b7e4fa8b60d6ffa36ab0fff00b303fc4f9eb08d80b68815552900"
}
```

### **6.3 dapp提现**
#### **6.3.1 创建提现交易，type=13**

`assetPlugin.createPluginAsset(type, assetInfo, secret, secondSecret)`
```
var obj = {
    recipient_id: "DLbsdFXJNVa68SCAJxtGMaGdfBWkPALZzJ",
    dapp_id: "14819b293859529eba5ca7b51cde02b808699fc0b128fd4de94800dc99665a48",
    currency: "DDN",
    aobAmount: "100000000"
}
var transaction = await DdnJS.assetPlugin.createPluginAsset(12, obj, secret, secondSecret)
{
    type: 13,
    nethash: "0ab796cd",
    amount: "0",
    recipient_id: "DLbsdFXJNVa68SCAJxtGMaGdfBWkPALZzJ",
    sender_public_key: "07ada08c4585cfda5e095ec3796f4fa88c93484113d18b6219aea5511231309c",
    timestamp: 55265725,
    message: null,
    asset: {
        outTransfer: {
            dapp_id: "14819b293859529eba5ca7b51cde02b808699fc0b128fd4de94800dc99665a48",
            currency: "DDN",
            amount: "100000000"
        }
    },
    fee: "10000000",
    signature: "5cd65d4d0a3a79c00864ddb3d3d0add8c9c9244a0115ad642301d8c5e7ee72459a354bc647486535cf0018609ed6f6ef061bde0984f9f40cc3dee5aa38861e00"
}
```

#### **6.3.2 受托人对提现交易进行签名**

`transfer.signOutTransfer(transaction, secret, secondSecret)`   
`备注` dapp提现交易，需要多个受托人签名后才能生效。受托人签名的最小数量取决于dapp的注册参数：unlock_delegates。

```
// 沿用上一章节《6.3.1 创建提现交易,type=13》的变量
transaction.signatures = []; // 受托人签名列表
for (let i = 0; i < dapp.unlock_delegates; i++) {
    transaction.signatures.push(await node.ddn.transfer.signOutTransfer(transaction, delegates[i].password))    //使用受托人密钥对交易进行签名
}
{
    type: 13,
    nethash: "0ab796cd",
    amount: "0",
    recipient_id: "DLbsdFXJNVa68SCAJxtGMaGdfBWkPALZzJ",
    sender_public_key: "07ada08c4585cfda5e095ec3796f4fa88c93484113d18b6219aea5511231309c",
    timestamp: 55265725,
    message: null,
    asset: {
        outTransfer: {
            dapp_id: "14819b293859529eba5ca7b51cde02b808699fc0b128fd4de94800dc99665a48",
            currency: "DDN",
            amount: "100000000"
        }
    },
    fee: "10000000",
    signature: "5cd65d4d0a3a79c00864ddb3d3d0add8c9c9244a0115ad642301d8c5e7ee72459a354bc647486535cf0018609ed6f6ef061bde0984f9f40cc3dee5aa38861e00",
    signatures: ["5cd65d4d0a3a79c00864ddb3d3d0add8c9c9244a0115ad642301d8c5e7ee72459a354bc647486535cf0018609ed6f6ef061bde0984f9f40cc3dee5aa38861e00", "a973969668745228b7908521d1acb3dabe3a9aaa448ceeeede145b71e7e5377a61797552b145f8643b76cb809296b2c267a8bd8599705de19b2edb1a3589e300", "8973bd23807763fc3e1973b269665e256c0c61a181b090705afea7038d0ba0adcfafbfc371f334be84b33630de0528e05c5ffe9e5c8c296e92c190582dadc30d"]
}
```


## **7 存证Evidence** 

### **7.1 创建存证交易，type=10**

`assetPlugin.createPluginAsset(type, assetInfo, secret, secondSecret)`
```
var assetEvidence = {
    ipid: "ipid1234567890",
    title: "如何使用DDN进行存证操作",
    hash: "5cfda5e095ec3796f4fa88c93484113d18b6219aea5511231309c",
    description: "介绍存证操作的步骤和使用指南",
    tags: "evidence example",
    author: "wangxm",
    url: "http://www.ebookchain.org",
    type: ".doc",
    size: "215355"
}
await DdnJS.assetPlugin.createPluginAsset(10, assetEvidence, secret, secondSecret)
{
    type: 10,
    nethash: "0ab796cd",
    amount: "0",
    recipient_id: null,
    sender_public_key: "2e6d978c5e6f1fbfc5a27abd964d9b6adc352daa81e31d9098a4f5ee3d7f885e",
    timestamp: 55274351,
    message: null,
    asset: {
        evidence: {
            ipid: "ipid1234567890",
            title: "如何使用DDN进行存证操作",
            hash: "5cfda5e095ec3796f4fa88c93484113d18b6219aea5511231309c",
            description: "介绍存证操作的步骤和使用指南",
            tags: "evidence example",
            author: "wangxm",
            url: "http://www.ebookchain.org",
            type: ".doc",
            size: "215355"
        }
    },
    fee: "10000000",
    signature: "34c13aabe67082e107942c9b88622616041d3cb8e987c8ae56beebe93157fa143469d38036ea11aefcdd250a5149e8e145c16e91ff8301f14c571270a709750f"
}
```

## **8 签名验证相关crypto**

自定义如下已签名的转账交易内容(在主链给D4FN28d1mfjdUG7rtUzEAstFVzPsmWUm2L转账100DDN)，用于下面章节演示。
```
var targetAddress = "D4FN28d1mfjdUG7rtUzEAstFVzPsmWUm2L";  
var amount = 100*100000000;   //100 DDN
var message = 'notethis';
var transaction = await DdnJS.transaction.createTransaction(targetAddress, amount, message, secret, secondSecret)

{
    type: 0,
    nethash: "0ab796cd",
    amount: "10000000000",
    fee: "10000000",
    recipient_id: "D4FN28d1mfjdUG7rtUzEAstFVzPsmWUm2L",
    message: "notethis",
    timestamp: 55275113,
    asset: {},
    sender_public_key: "2e6d978c5e6f1fbfc5a27abd964d9b6adc352daa81e31d9098a4f5ee3d7f885e",
    signature: "785cdcbf205980cd995c44603a0c68aa4a6f5aa1b89d7679712d5925efe7cf4dd721cd7e8e48f3db21a3ea055baec85990dca2886bf651feacd2ed9cf2c2060d",
    id: "ea9eb61d77bd3e405786dcdef04d5486a2c52ed3448216fefedc453c8a12b06b"
}
```

### **8.1 根据交易内容获取字节Buffer对象**

`crypto.getBytes(transaction, skipSignature, skipSecondSignature)`

- `transaction` 交易内容,可以是签名后也可是未签名的,默认需传入签名后的交易。必传参数
- `skipSignature` 是否跳过签名计算，默认不跳过。非必传参数
- `skipSecondSignature` 是否跳过二级密码签名计算，默认不跳过。非必传参数

```
// 此时transaction.signature和transaction.signSignature都会计算在内
await DdnJS.crypto.getBytes(transaction) 
<Buffer 00 41 6f 4b 03 30 61 62 37 39 36 63 64 2e 6d 97 8c 5e 6f 1f bf c5 a2 7a bd 96 4d 9b 6a dc 35 2d aa 81 e3 1d 90 98 a4 f5 ee 3d 7f 88 5e 44 34 46 4e 32 ... >   // 返回的字节buffer对象
```

### **8.2 根据交易内容获取Hash Buffer对象**

`crypto.getHash(transaction, skipSignature, skipSecondSignature)`

- `transaction` 交易内容,可以是签名后也可是未签名的,默认需传入签名后的交易。必传参数
- `skipSignature` 是否跳过签名计算，默认不跳过。非必传参数
- `skipSecondSignature` 是否跳过二级密码签名计算，默认不跳过。非必传参数

```
// 此时transaction.signature和transaction.signSignature都会计算在内
await DdnJS.crypto.getHash(transaction)
<Buffer d5 31 9c 14 43 4c 7d c4 49 80 b5 8e 81 70 cb 45 fe 53 4c 58 6b c0 bc 1d 42 49 1c 22 47 28 42 a1> // 返回的Hash Buffer
```

### **8.3 对交易Bytes Buffer进行签名**

`crypto.signBytes(bytes, keys)`

- `bytes` 交易的Bytes Buffer，未签名交易或者一级密码签名但二级密码未签名的交易
- `keys` 公钥/私钥 密钥对

```
// 定义未签名交易
var transaction = {
    type: 0,
    nethash: "0ab796cd",
    amount: "10000000000",
    fee: "10000000",
    recipient_id: "D4FN28d1mfjdUG7rtUzEAstFVzPsmWUm2L",
    message: "notethis",
    timestamp: 55275113,
    asset: {}
}

// 根据密码，生成
var keys = await node.ddn.crypto.getKeys(node.Gaccount.password);
{
    "public_key":"2e6d978c5e6f1fbfc5a27abd964d9b6adc352daa81e31d9098a4f5ee3d7f885e","private_key":"863669059023e53d46d92b6a1a7bdaa8a9ff3555d98c07517c2a3a08c89ff9d02e6d978c5e6f1fbfc5a27abd964d9b6adc352daa81e31d9098a4f5ee3d7f885e"
}

transaction.sender_public_key = keys.public_key;
'2e6d978c5e6f1fbfc5a27abd964d9b6adc352daa81e31d9098a4f5ee3d7f885e'

// 获取交易的Bytes Buffer
var buf = await node.ddn.crypto.getBytes(transaction);
'<Buffer 00 69 6e 4b 03 30 61 62 37 39 36 63 64 2e 6d 97 8c 5e 6f 1f bf c5 a2 7a bd 96 4d 9b 6a dc 35 2d aa 81 e3 1d 90 98 a4 f5 ee 3d 7f 88 5e 44 34 46 4e 32 ... >'

// 通过私钥对交易Bytes Buffer进行签名
var signature = node.ddn.crypto.signBytes(buf, keys);
'785cdcbf205980cd995c44603a0c68aa4a6f5aa1b89d7679712d5925efe7cf4dd721cd7e8e48f3db21a3ea055baec85990dca2886bf651feacd2ed9cf2c2060d'    // 返回值与上面自定义的已签名交易中的签名一致

transaction.signature = signature;
```

### **8.4 验证交易签名是否和已存在的签名一致**

`crypto.verifyBytes(bytes, signature, publicKey)` 返回true/false

- `bytes` 交易的Bytes Buffer，未签名交易或者一级密码签名但二级密码未签名的交易
- `signature` 待校验的签名
- `publicKey` 签名者公钥

```
// 沿用上一章节《对交易Bytes Buffer进行签名》的变量
DdnJS.crypto.verifyBytes(buf,transaction.signature,transaction.senderPublicKey)
true
```

## **9 其它**

### **9.1 全局参数变量options**

#### **9.1.1 设置变量k/v**
`options.set(key, values)`

- `key` 键名
- `value` 键值

```
DdnJS.options.set('secret','avocado immense push minor borrow display rebel depart core buzz right distance')
```


#### **9.1.2 根据key获取value**

`options.get(key)`

- `key` 键名

```
DdnJS.options.get('secret')
'avocado immense push minor borrow display rebel depart core buzz right distance'
```


#### **9.1.3 获取所有的k/v**

`options.getAll()`

```
DdnJS.options.getAll()
{
    "clientDriftSeconds":5,     // ddn-node-sdk内置变量
    "nethash":"0ab796cd",       // DDN区块链标识值
    "secret":"avocado immense push minor borrow display rebel depart core buzz right distance"
}
```

### **9.2 时间相关slot.time**

#### **9.2.1 DDN主网创世块生成时间**

`utils.slots.beginEpochTime()`
`备注` 结果为UTC时间,即DDN纪元的开始时间。

```
DdnJS.utils.slots.beginEpochTime()
2017-08-20T20:00:00.000Z // DDN主网创世块（block heihgt=1）生成时间，但主网正式运行可以延后（主网正式运行的标志是 生成了block heihgt=2的区块）
```


#### **9.2.2 根据unix时间戳获获DDN时间戳**

`utils.slots.getTime(time)` 
`备注` 获得结果叫做EpochTim（DDN时间戳），传入的time相对于DDN纪元经历的秒数

- `time` 如果不传值则取当前时刻的 Unix时间戳*1000 (即单位是毫秒）

```
DdnJS.utils.slots.getTime()
40655681 // DDN时间戳

var unix_timestamp = 1507713496
var epochTime = DdnJS.utils.slots.getTime(unix_timestamp * 1000)
40655896    // DDN时间戳
```

#### **9.2.3 根据DDN时间戳获取unix时间戳**

`utils.slots.getRealTime(epochTime)`
`备注` 返回结果是真实的 unix时间戳* 1000

- `epochTime` DDN时间戳，单位是秒

```
var unix_timestamp = 1507713496  // unix时间戳
var epochTime = DdnJS.utils.slots.getTime(unix_timestamp * 1000)
40655896    // 通过unix时间戳获取到DDN时间戳

var real_time = DdnJS.utils.slots.getRealTime(epochTime)
1507713496000 // 通过DDN时间戳获取unix时间戳

var unix_timestamp === real_time / 1000
true // 换算结果一致
```

