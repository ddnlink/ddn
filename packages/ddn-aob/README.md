DDN链上资产包
===

交易体创建方法：
ddnJS.assetPlugin.createPluginAsset(trsType, assetInfo, secret, secondSecret)
参数：
    trsType: 创建交易的类型；  
    assetInfo: 创建交易的具体内容；  
    secret: 账号的密码；  
    secondSecret: 二级密码；(可不传)  
返回：
    创建成功的交易体对象

一、issuer
====  
注册发行商
```
trsType: 60
assetInfo: {  
              name: "DDD", // 资产名
              desc: "J G V", // 资产简介
              issuer_id: node.Eaccount.address, // 资产创建者地址（账号）
              fee: '10000000000', // 手续费
            }  
```

二、asset
====  
注册资产
```
trsType: 61
assetInfo: {  
                name: "DDD.NCR", // 币种名称
                desc: "DDD新币种", // 币种简介
                maximum: "100000000", // 发行量（最大值）
                precision: 2, // 精度
                strategy: '', // 策略
                allow_blacklist: '0', // 黑名单
                allow_whitelist: '0', // 白名单
                allow_writeoff: '0', // 是否允许注销
                fee: '50000000000' // 手续费
            }  
```

三、issue
====  
发行资产
```
trsType: 64
assetInfo: {  
                currency: "DDD.NCR", // 币种
                aobAmount: "100000", // 发行量（字符串）
                fee: "10000000" //手续费
            }
```

四、transfer
====  
交易对应资产
```
trsType: 65
assetInfo: {  
                receive_address: "xxxxxxxxx", // 接受者地址
                currency: "DDD.NCR", // 币种
                aobAmount: "10", // 转账金额
                message: '测试转账' // 附加信息，可选
            }
```

五、setfalg
===
设置资产参数
```
trsType: 62
assetInfo: {
                currency: "DDN.NCR",    //币种
                flag_type: 1,   //参数设置对象（1：黑白名单设置，2：是否注销设置）
                flag: 1     //参数值：flag_type=1（0：黑名单，1：白名单，2：默认），flag_type=2（0：默认，1：注销）
           }
```

六、acl
===
设置黑白名但列表
```
trsType: 63
assetInfo: {
                currency: "DDN.NCR",    //币种
                flag: 1,    //设置类型（0：黑名单，1：白名单）
                operator: "+",  //操作（+：增加，-：删除）
                list: "xxxxxxxxxxxxxxxxx, yyyyyyyyyyyyyyyyyy"   //黑白名单具体列表内容，多个逗号分隔
           }
```