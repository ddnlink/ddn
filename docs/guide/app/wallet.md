---
order: 1
id: wallet
title: 钱包开发
sidebar_label: wallet development
---

# 钱包开发

## 1. 生成区块链账户

区块链钱包是用来存储用户数字资产的地方。只有了解钱包的种类和特性，才能更好的存储和使用自己的数字资产，给自己选择一个便捷的操作体验。

1.1 如何生成一个区块链账户  
调用Node-SDK，参考  DDN-Node-SDK  文档中的账户部分  
DDN区块链系统通过bip39模块里的方法生成一个随机的12个单词助记词，该助记词用户必须妥善保管，确保助记词不丢失或泄露，系统用该助记词生成区块链账户的私钥和公钥，私钥是保密的，一般不明文显示，在系统中缓存时会进行加密使用时再进行解密，而公钥对大家都是公开的，为方便人的肉眼识别，会对公钥进行处理，DDN区块链将公钥进行哈希计算后增加一个标识前缀作为区块链账户地址。

```js
// 引入DDN的node-sdk到代码中
const DdnJS = require("@ddn/node-sdk").default;

// 调用node-sdk方法，生成12个单词的助记词
const phaseKey = DdnJS.crypto.generateSecret();

// 打印生成的助记词，查看控制台的输出
console.log("phaseKey:", phaseKey)
// > business search shell oppose install absent radio try sauce budget dice phone

// 用生成的助记词生成账户公私钥对
const keyPair = DdnJS.crypto.getKeys(phaseKey);

// 打印公私钥对查看，结果如下
console.log("keyPair:", keyPair)
// > keyPair: { 
//   publicKey: 'f7fb38029f6c1d2d4a96f5fdbc8cc470adff055bdac6bf8dad61de3302ba60c0',
//   privateKey: '0d1b26d52191262d71eb0f5a6838f362e130915877dda7053c5f517456e538d5f7fb38029f6c1d2d4a96f5fdbc8cc470adff055bdac6bf8dad61de3302ba60c0' 
//  }

// 获取公钥和私钥
const publicKey = keyPair.publicKey;
const privateKey = keyPair.privateKey;

// 调用SDK, 通过获取的公钥生成账户地址
const address = DdnJS.crypto.generateAddress(publicKey)

// 打印公私钥对查看，结果如下
console.log("address:", address)
// > address: DKBab2GEwE1pF5vDew1jffuLK7uegT6aYN

```

## 2. 用助记词作账户登录
```js
// 调用SDK和加密模块
const DdnJS = require("@ddn/node-sdk").default;
const CryptoJS = require("crypto-js");

// 定义一个正确的助记词和一个错误的助记词
const wrongSecret = "this is wrong secret"
const rightSecret = "business search shell oppose install absent radio try sauce budget dice phone"

// 获取输入的助记词, 去除输入时的前后空格, 并做格式验证
let inputText = rightSecret
const phaseKey = inputText.trim()
const isPhaseKey = DdnJS.crypto.isValidSecret(phaseKey)
console.log("isPhaseKey", isPhaseKey)
if(!isPhaseKey){
    return 
}

// 2. 通过格式校验后，对获取的助记词进行保存，并登录
// 构造一个随机字符函数
/**
 * @param size 
 */
function randomHash(size){
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#$%^&*@"
    let name = ''
    for(i=0;i<size;i++){
        name +=  possible.charAt(Math.floor(Math.random() * possible.length))
    }
    return name 
}

// 获取随机数，并将随机数保存在内存中，加密助记词
let randomString = randomHash(7)
let salt = 'ddnwallet'
var ciphertext = CryptoJS.AES.encrypt(phaseKey, salt + randomString).toString()
console.log("ciphertext", ciphertext)

// 助记词加密后保存到浏览器缓存sessionStorage中
const keyPair = DdnJS.crypto.getKeys(phaseKey)
const address = DdnJS.crypto.generateAddress(keyPair.publicKey) 
let keyStore = {
    address: address,
    salt: 'ddnwallet',
    cipher: ciphertext,
    authority: 'user',
}
console.log("keyStore", keyStore)
// sessionStorage.setItem('keyStore', JSON.stringify(keyStore))

// 4. 登录后调用私钥
// const keyStoreString = sessionStorage.getItem('keyStore');
// authorityString could be admin, "admin", ["admin"]
// let keyStoreJson;
// try {
//     keyStoreJson = JSON.parse(keyStoreString);
// } catch (e) {
//     keyStoreJson = {};
// }
let secretByte = CryptoJS.AES.decrypt(keyStore.cipher, keyStore.salt + randomString)
let originSecret = secretByte.toString(CryptoJS.enc.Utf8)
console.log("originSecret", originSecret)

```

3. 完成锁仓交易

锁仓交易，就是将该账户在区块链系统中锁住，一定时间内不能转移出售或发起交易操作。

```js
const DdnJS = require("@ddn/node-sdk").default;

// 从界面获取输入的区块高度，区块高度在某种程度上代表着时间，在界面中输入区块链高度后，会给出一个参考的对应时间，代表区块链运行到此高度后，该账户会自动解锁

let inputHeight = 10086

// 获取私钥
const keyStoreString = sessionStorage.getItem('keyStore');
let keyStoreJson;
try {
    keyStoreJson = JSON.parse(keyStoreString);
} catch (e) {
    keyStoreJson = {};
}
let secretByte = CryptoJS.AES.decrypt(keyStore.cipher, keyStore.salt + randomString)
let originSecret = secretByte.toString(CryptoJS.enc.Utf8)

// 锁仓方法
async function lock(){
    let lockTransaction = await DdnJS.transaction.createLock(inputHeight, originSecret, undefined);
    console.log("lockTransaction", lockTransaction)
}

// 调用锁仓方法
lock()
```
