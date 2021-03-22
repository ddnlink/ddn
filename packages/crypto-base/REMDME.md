# 说明

>该插件为ddn区块链的加密算法提供一些公共方法，实现相应的加密算法时，需要引入该包，使用其中的公用方法，防止代码的重复使用

# 安装

```bash
nnpm install @ddn/crypto-base 
```

or

```bash
yarn add @ddn/crypto-base
```

# 使用

```js
import * as DdnCrypto from '@ddn/crypto-base'
```

# 公共方法说明 

## **1 getBytes方法**

`该方法会根据json的键递归升序排序字段，循环json根据json的值的类型获取字节，返回buffer`

请求参数说明：

|名称	|类型   |必填 |说明 |默认|
|------ |-----  |---  |----|---              |
|data|json|Y|需要获取字节的数据|
|skipSignature|boolean|N|是否跳过获取签名字段的字节|false
|skipSecondSignature|boolean|N|是否跳过获取二次签名字段的字节|false
|skipId|boolean|N|是否跳过获取id字段的字节|true

使用方式

```
const data={b:'old',a:'hah'}
Ddncrypto.getBytes(data,false,false,false)
```

## **2 base58Check encode方法**

`Base58Check编码用于将字节数组编码为可分类、易读的字符`

请求参数说明：

|名称	|类型   |必填 |说明 |默认|
|------ |-----  |---  |----|---              |
|data|buffer|Y|字符串的buffer|

使用方式

```
Ddncrypto.encode(buffer)
```

## **2 base58Check decode方法**

`对地址进行解密，返回buffer`

请求参数说明：

|名称	|类型   |必填 |说明 |默认|
|------ |-----  |---  |----|---              |
|address|string|Y|buffer加密后的字符串|

使用方式

```
Ddncrypto.decode(address)
```
## **2 base58Check decodeUnsafe方法**

`将base58校验编码字符串解码到缓冲区，如果校验和错误，则没有结果，也就是验证地址是否正确`

请求参数说明：

|名称	|类型   |必填 |说明 |默认|
|------ |-----  |---  |----|---              |
|any|string|Y|地址|

使用方式

```
Ddncrypto.decodeUnsafe(address)
```