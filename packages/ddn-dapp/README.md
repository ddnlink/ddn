#ddn-dapp使用方法  
trsType: 创建交易的类型；  
assetInfo: 创建交易的具体内容；  
secret: 账号密码；  
secondSecret: 二级密码；(可不传)  
都是调用ddn-js  assetPlugin.createPluginAsset(trsType, assetInfo, secret, secondSecret) 方法创建交易  

##一：Dapp  
```
trsType: 11;  
assetInfo: {  
              secret: 密码,  
              category: node.randomProperty(node.DappCategory),  
              type: node.DappType.DAPP,  
              name: DappName,  
              description: "A dapp added via API autotest",  
              tags: "handy dizzy pear airplane alike wonder nifty curve young probable   tart concentrate",  
              link: node.guestbookDapp.link,  
              icon: node.guestbookDapp.icon,  
            }  
```

##二：inTransfer  
```
trsType: 12;  
assetInfo: {  
              secret: 密码,  
              category: node.randomProperty(node.DappCategory),  
              type: node.DappType.DAPP,  
              name: DappName,  
              description: "A dapp added via API autotest",  
              tags: "handy dizzy pear airplane alike wonder nifty curve young pr obable   tart concentrate",  
              link: node.guestbookDapp.link,  
              icon: node.guestbookDapp.icon,  
            }  
```

##三：outTransfer  
```
trsType: 13;  
assetInfo: {  
              secret: 密码,  
              category: node.randomProperty(node.DappCategory),  
              type: node.DappType.DAPP,  
              name: DappName,  
              description: "A dapp added via API autotest",  
              tags: "handy dizzy pear airplane alike wonder nifty curve young probable   tart concentrate",  
              link: node.guestbookDapp.link,  
              icon: node.guestbookDapp.icon,  
            }  
```

 