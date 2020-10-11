---
title: 贡献
order: 2
---

# 贡献

## 初始化

摘取代码

```bash
$ git clone https://github.com/ddnlink/ddn.git
```

安装开发包

```bash
$ cd ddn
$ yarn
```

Bootstrap every package with yarn. (Need to execute when new package is included)

```bash
$ yarn bootstrap
```

Build first.

```bash
$ yarn build / -w
```

在另一个命令框执行

```bash
$ cd examples/fun-tests
$ yarn start
```

如果没有反应，执行以下命令

```bash
$ cd examples/fun-tests
$ touch .ddnrc.local.js
```

然后，把以下内容复制到`.ddnrc.local.js`

```js
/*---------------------------------------------------------------------------------------------
 *  This is your config local.
 *--------------------------------------------------------------------------------------------*/

module.exports = {
  /**
   * About Peer
  */
  // port: 8001,
  // address: "127.0.0.1",
  // publicIp: "",
  logLevel: "info", // This allows the command line to output more info for development testing
  // net: "testnet"
}
```

## 常见操作

监视文件更改并使用babel进行转换。

```bash
$ yarn build --watch
```

运行测试

```bash
# 包括 e2e 的测试
$ yarn test

# 仅单元测试
$ yarn test .test.(t|j)s

# 测试指定文件并观看
$ yarn test getMockData.test.js -w

# 测试指定的包
$ PACKAGE=core yarn test

# 不执行 e2e 测试
$ E2E=none yarn test

# Generate coverage
$ yarn test --coverage
```

发布到npm

```bash
# 首先生成变更日志
$ yarn changelog

# 这行命令不要使用yarn
$ npm run publish
```
