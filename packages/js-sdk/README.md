# DDN js Library

## About 关于

这是 DDN javascript SDK，兼容浏览器端

## Install 安装

```
npm install @ddn/js-sdk --save
```

## Usage 使用

只要基于 ES6 开发，Node.js或浏览器端都可以这样调用

```
// 初始化网络标示以及加密算法
import DdnJS from '@ddn/js-sdk';
// 加密算法 是['@ddn/crypto-nacl', '@ddn/crypto-sm']其中之一默认为@ddn/crypto-nacl
// DdnJS.init('0ab796cd','@ddn/crypto-nacl) 这是默认值
DdnJS.init('0ab796cd')
```

Please reference the [ddn http interface documents](https://github.com/ddnlink/ddn-docs/js-sdk-api.md)

## Develop 开发

注意的是，不建议在其他组件里调用本包，避免循环引用；同时，本包使用的 Http Api，所以不需要引入资产包。

## Release 发布

每次修改发布，请执行一次如下命令，以便打包 web 端文件`ddn.min.js`

```
$ yarn build
```