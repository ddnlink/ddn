# DDN Node SDK

> **警告：此包已经弃用，请使用 `@ddn/js-sdk` 替代。**

## About 关于

这是 DDN javascript SDK，兼容基于Node.js的服务端和浏览器端。该包已经被 `@ddn/js-sdk` 替代，建议使用新版的 SDK。

## Install 安装

```
npm install @ddn/node-sdk --save
```

## Usage 使用

Node.js可以这样调用

```javascript
// 弃用的方式
import DdnJS from '@ddn/node-sdk'; // const DdnJS = require('@ddn/node-sdk).default

// 推荐的新方式
import DdnJS from '@ddn/js-sdk';
const { config, constants } = DdnJS.init({
  net: 'mainnet' // 指定网络类型：'mainnet' 或 'testnet'
});

// 也可以使用 setup 方法（向后兼容）
// const { config, constants } = DdnJS.setup({ net: 'mainnet' });

// 如果使用配置文件，在项目根目录建立 .ddnrc.js 或 config/config.js 配置
// 链参数常量，向链定制项目方获取，并放置在 config/constants.js
```

请参考 [@ddn/js-sdk README](../js-sdk/README.md) 了解更多关于新版 SDK 的配置和使用方法。

Please reference the [ddn http interface documents](https://github.com/ddnlink/ddn-docs/node-sdk-api.md)

Note：Please copy `constants` to folder `config` in your project, and copy `.ddnrc.js` to your project`s root folder

## Develop 开发

注意的是，不建议在其他组件里调用本包，避免循环引用；同时，本包使用的 Http Api，所以不需要引入资产包。

## Release 发布

每次修改发布，请执行一次如下命令

```
$ cd /path/to/ddn
$ pnpm build --filter @ddn/js-sdk  # 注意：我们现在构建 js-sdk 而非 node-sdk
```

## Test 测试

测试用例在`test`文件夹下，运行测试需要在工程目录下，使用`pnpm test`执行，可以执行整个测试

```
$ pnpm test
```

如果需要更细致的测试，比如：测试 AoB 资产，请使用：

```
$ pnpm test nodeSdk.aob.test.js // 测试aob模块
```

如果需要了解更细致的信息，请使用 debug ，例如：

```
$ DEBUG=debug_name pnpm test nodeSdk.aob.test.js // debug_name 是测试文件里，通过 debug('debug_name') 定义的。
```