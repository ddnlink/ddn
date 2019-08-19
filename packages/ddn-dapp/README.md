DDN Dapp
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

##一：Dapp  
注册Dapp
```
trsType: 11
assetInfo: {  
                name: DappName, //Dapp名称
                type: node.DappType.DAPP,   //Dapp类型
                category: node.randomProperty(node.DappCategory),   //Dapp分类
                link: node.guestbookDapp.link,  //Dapp程序包链接
                description: "A dapp added via API autotest",   //描述
                tags: "handy dizzy pear airplane alike wonder nifty curve young probable tart concentrate", //标签，空格分隔
                icon: node.guestbookDapp.icon,  //Dapp Logo链接
                delegates: delegates.join(","), //Dapp 受托人公钥串，多个用逗号分隔
                unlock_delegates: 3 //转出操作需要的最小受托人确认数
           }  
```

##二：inTransfer  
向Dapp内转账
```
trsType: 12
assetInfo: {
                dapp_id: "f90e1f741168106f3bbd76e5eea6aa47d725d1e9b78e2ad6f043d0719881ba22",    //Dapp Id
                currency: "DDN",    //要转入的币种
                amount: "100000000" //要转入的金额
           }
```

##三：outTransfer  
从Dapp向外转账
```
trsType: 13
assetInfo: {
                recipient_id: ,  //转账接收账户地址
                dapp_id: "f90e1f741168106f3bbd76e5eea6aa47d725d1e9b78e2ad6f043d0719881ba22",    //Dapp Id
                currency: "DDN",    //要转出的币种
                aobAmount: "10000000"   //要转出的金额,
                signatures: [   //受托人签名数组，通过方法await node.ddn.transfer.signOutTransfer(trs, delegatePassword)获得
                    "xxxxxxxxxxxxxxxxxxxxxxx",
                    "yyyyyyyyyyyyyyyyyyyyyyy",
                    "zzzzzzzzzzzzzzzzzzzzzzz"
                ]
           }
```

有关Dapp相关信息请查看ddn-docs项目的Dapp部分