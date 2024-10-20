# DDN js Library

## About 关于

这是 DDN javascript SDK，兼容基于Node.js的服务端和浏览器端

## Install 安装

```
npm install @ddn/node-sdk --save
```

## Usage 使用

Node.js可以这样调用

```
import DdnJS from '@ddn/node-sdk'; // const DdnJS = require('@ddn/node-sdk).default

// 默认的配置和常量是测试链的，想要使用自己的配置
在项目根目录建立 .ddnrc.js 或 config/config.js 配置

// 链参数常量，向链定制项目方获取，并放置在 config/constants.js
```

Please reference the [ddn http interface documents](https://github.com/ddnlink/ddn-docs/node-sdk-api.md)

Note：Please copy `constants` to folder `config` in your project, and copy `.ddnrc.js` to your project`s root folder
 
## Develop 开发

注意的是，不建议在其他组件里调用本包，避免循环引用；同时，本包使用的 Http Api，所以不需要引入资产包。

## Release 发布

每次修改发布，请执行一次如下命令

```
$ cd /path/to/ddn
$ pnpm build --filter @ddn/js-sdk
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