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
trsType: 10
assetInfo: {  
                ipid: "ipid12345",  //存证ipid，唯一
                title: "测试",      //存证内容标题
                hash: "xxxxxxxx",   //存证内容哈希值
                author: "wangxm",   //存证内容作者
                url: "http://www.test.com/test.doc",    //存证内容链接地址
                type: ".doc",   //存证文档类型
                description: "这是一个存证测试",    //描述
                tags: "测试 存证",  //标签，多个用空格分隔
                size: "102400"  //内容字节大小
           }  
```
