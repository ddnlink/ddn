---
id: ddn-crypto-develop
title: ddn加密算法开发
sidebar_label: Development of DDN encryption algorithm
---

# DDN加密算法

目前ddn为用户提供两种加密算法，一种是基于npm包[tweetnacl](https://www.npmjs.com/package/tweetnacl)实现,一种是基于[ed25519](https://www.npmjs.com/package/ed25519)实现，如果这两种加密算法不能满足用户需求，用户可以定制开发自己需要的加密算法，只要提供ddn需要的相关api，就能无缝衔接

DDN采用的是模块化开发模式，使用learn来管理项目，当然加密算法也是其中的一个包，所以用户只需按照要求开发需要的加密算法包，然后安装，在配置文件里配置就可以在DDN网络里使用，下面是DDN加密算法开发和加载逻辑

## 1 加密算法命名规则

DDN要求开发者使用crypto-${name}的命名规则，例如系统提供的crypto-nacl、crypto-ed25519

## 2 crypto-base包说明

crypto-base为开发者提供了一些加密过程中需要通用的加密方法，比如getBytes、encode 、dencode等方法，用户只需要在新的包中安装引用它即可，更多详细的信息请查看[crypto-base]()文档

## 3 开发加密算法需要实现的方法说明

### 3.1 同步方法getBytes

该方法是对给定的json数据获取相应的字节

参数说明

|名称	|类型   |必填 |说明 |默认|
|------ |-----  |---  |----|---              |
|data|json|Y|需要获取字节的数据|
|skipSignature|boolean|N|是否跳过获取签名字段的字节|false
|skipSecondSignature|boolean|N|是否跳过获取二次签名字段的字节|false
|skipId|boolean|N|是否跳过获取id字段的字节|true

### 3.2 异步方法getKeys

该方法是对给定的字符串数据获取相应公钥和私钥

参数说明

|名称	|类型   |必填 |说明 |默认|
|------ |-----  |---  |----|---              |
|address|string|Y|需要获取公钥和私钥的字符串|

返回参数说明

|名称	|类型  |说明
|------ |----- |----         |
|data|josn|返回数据|
|｜---publicKey|string|公钥|
|｜---privateKey|string|私钥|

### 3.3 异步方法getId

该方法是对给定的json数据进行加密处理返回加密后的数据

参数说明

|名称	|类型   |必填 |说明 |默认|
|------ |-----  |---  |----|---              |
|data|object|Y|需要获取id的json数据|


返回参数说明

|名称	|类型  |说明
|------ |----- |----         |
|id|string|返回数据|

### 3.4 异步方法getHash

该方法是对给定的json数据进行加密处理返回相应的hash值

参数说明

|名称	|类型   |必填 |说明 |默认|
|------ |-----  |---  |----|---              |
|data|object|Y|需要获取hash的json数据|
|skipSignature|boolean|N|是否跳过获取签名字段的字节|false
|skipSecondSignature|boolean|N|是否跳过获取二次签名字段的字节|false

返回参数说明

|名称	|类型  |说明
|------ |----- |----         |
|data|hash|返回数据|

### 3.5 异步方法createHash

该方法是获取给定字节的数据（一般是通过3.1返回创建的数据）的哈希值，该方法返回的数据类型必须和3.4返回的数据类型一致

参数说明

|名称	|类型   |必填 |说明 |默认|
|------ |-----  |---  |----|---              |
|data|bytes，通过3.1获取的数据|Y|需要获取hash的数据|

返回参数说明

|名称	|类型  |说明
|------ |----- |----         |
|data|hash|返回数据|

### 3.6 异步方法sign

签名方法，对给定的json数据进行签名，返回签名后的字符串

参数说明

|名称	|类型   |必填 |说明 |默认|
|------ |-----  |---  |----|---              |
|data|json|Y|需要获取签名的json数据|
|privateKey|string通过3.2获取的返回的私钥|Y|签名的私钥，该参数是包裹在json数据中传递到方法里|


返回参数说明

|名称	|类型  |说明
|------ |----- |----         |
|data|string|返回签名后的数据|

示例

```js
async sign(data,{privateKey}){

}
```

### 3.7 异步方法signWithHash

签名方法，对给定的hash数据进行签名，返回签名后的字符串

参数说明

|名称	|类型   |必填 |说明 |默认|
|------ |-----  |---  |----|---              |
|hash|通过3.4或者3.5生成|Y|需要获取签名的hash数据|
|privateKey|string通过3.2获取的返回的私钥|Y|签名的私钥，该参数是包裹在json数据中传递到方法里|

返回参数说明

|名称	|类型  |说明
|------ |----- |----         |
|sign|string|返回签名后的数据|

```js
async sign(hash,{privateKey}){

}
```
### 3.8 异步方法secondSign

二次签名方法，对给定的hash数据进行签名，返回签名后的字符串

参数说明

|名称	|类型   |必填 |说明 |默认|
|------ |-----  |---  |----|---              |
|hash|通过3.4或者3.5生成|Y|需要获取签名的hash数据|
|privateKey|string通过3.2获取的返回的私钥|Y|签名的私钥，该参数是包裹在json数据中传递到方法里|



返回参数说明

|名称	|类型  |说明
|------ |----- |----         |
|sign|string|返回签名后的数据|

```js
async secondSign(data,{privateKey}){

}
```

### 3.9 同步方法verifyBytes

对3.1获取的字节数据进行认证

参数说明

|名称	|类型   |必填 |说明 |默认|
|------ |-----  |---  |----|---              |
|bytes|通过3.1生成|Y|需要验证的数据|
|signature|string通过3.6获取的签名数据|Y|签名后的数据|
|publicKey|string通过3.2获取的公钥|Y|用公钥验证私钥加密的数据|



返回参数说明

|名称	|类型  |说明
|------ |----- |----         |
|data|boolean|返回true或者false|

```js
async verifyBytes(bytes,signature,publicKey){

}
```


### 3.10 同步方法verifyHash

对3.4或者3.5生成的hash获数据进行认证

参数说明

|名称	|类型   |必填 |说明 |默认|
|------ |-----  |---  |----|---              |
|hash|hash|Y|需要验证的数据|
|signature|string通过3.6获取的签名数据|Y|签名后的数据|
|publicKey|string通过3.2获取的公钥|Y|用公钥验证私钥加密的数据|


返回参数说明

|名称	|类型  |说明
|------ |----- |----         |
|data|boolean|返回true或者false|

```js
async verifyBytes(hash,signature,publicKey){

}
```
### 3.11 同步方法generateSecret

生成密码

参数说明

|名称	|类型   |必填 |说明 |默认|
|------ |-----  |---  |----|---              |



返回参数说明

|名称	|类型  |说明
|------ |----- |----         |
|scret|string|返回密码|



### 3.12 同步方法isValidSecret

验证密码是否合法

参数说明

|名称	|类型   |必填 |说明 |默认|
|------ |-----  |---  |----|---              |
|scret|string|Y|


返回参数说明

|名称	|类型  |说明
|------ |----- |----         |
|data|boolean|返回true或者false|

### 3.13 同步方法generateAddress

根据公钥生成区块链地址

参数说明

|名称	|类型   |必填 |说明 |默认|
|------ |-----  |---  |----|---              |
|publicKey|string|Y|通过3.2获取的公钥
|tokenPrefix|string|Y|地址前缀在配置文件里配置


返回参数说明

|名称	|类型  |说明
|------ |----- |----         |
|address|string|返回地址|

### 3.14 同步方法isAddress

验证地址是否正确

参数说明

|名称	|类型   |必填 |说明 |默认|
|------ |-----  |---  |----|---              |
|address|string|Y|通过3.13获取的地址
|tokenPrefix|string|Y|地址前缀在配置文件里配置


返回参数说明

|名称	|类型  |说明
|------ |----- |----         |
|data|boolean|返回true或者false|

`注意：上面说的异步方法是指方法返回的必须是个promise`

## 4 加密算法的使用

### 4.1 发布加密算法到npm

使用npm包管理工具发布您编写的加密算法到npm上

### 4.2 安装加密算法

在example/funtest下运行

```bash
npm install @packageName
```

### 4.3 配置加密算法

在在example/funtests/constants下配置

```js
...
"crypto":"packageName"
...

```






