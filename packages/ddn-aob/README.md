ddn链上资产包
===
trsType: 创建交易的类型；  
assetInfo: 创建交易的具体内容；  
secret: 账号的密码；  
secondSecret: 二级密码；(可不传)  
都是调用ddn-js  assetPlugin.createPluginAsset(trsType, assetInfo, secret, secondSecret) 方法创建交易  

一：issuer
====  
注册发行商
```
trsType: 75;  
assetInfo: {  
              name: "DDD", // 资产名
              desc: "J G V", // 资产简介
              issuer_id: node.Eaccount.address, // 资产创建者地址（账号）
              fee: '10000000000', // 手续费
            }  
```

二：asset
====  
注册资产
```
trsType: 76;  
assetInfo: {  
            name: "DDD.NCR", // 币种名称
            desc: "DDD新币种", // 币种简介
            maximum: "100000000", // 发行量（最大值）
            precision: 2, // 精度
            strategy: '', // 策略
            allow_blacklist: '0', // 黑名单
            allow_whitelist: '0', // 白名单
            allow_writeoff: '0', // 是否取消
            fee: '50000000000' // 手续费
            }  
```

三：issue
====  
发行资产
```
trsType: 77;  
assetInfo: {  
            currency: "DDD.NCR", // 币种
            aobAmount: "100000" // 发行量（字符串）
            }  
```

四：transfer
====  
交易对应资产
```
trsType: 78;  
assetInfo: {  
            receive_address: "xxxxxxxxx", // 接受者地址
            currency: "DDD.NCR", // 币种
            aobAmount: "10", // 转账金额 fix -> 是否应该是 secondaryAmount 
            message: '测试转账' // 附加信息可不加
            }  
```