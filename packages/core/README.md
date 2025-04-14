# @DDN/core

用于对 DDN 区块链 相关的配置等相关的基本操作，让系统支持 .ddnrc.js、constants.js 等根据环境不同的配置文件，以及提供统一的错误处理机制。

## 功能

- **配置管理**：支持多环境配置文件
- **错误处理**：提供统一的错误处理机制，包括错误类、错误码、错误格式化等功能
- **工具函数**：提供常用的工具函数

## 错误处理

DDN Core 提供了一套完整的错误处理机制，详细文档请参考：[DDN 错误处理指南](./docs/guide.md)

## 配置文件

DDN 允许在 `.ddnrc.t|js` ，`config/config.json` 或 `config/config.t|js`（五选一，`.ddnrc.t|js` 优先），以及基于该配置的 `constants.t|js`,  `config/constants.t|js`(四选一，必须有一个，`constants.t|js`优先) 中进行配置，支持 ES6 语法。

**注意**：不要将上述配置混合使用，按照优先级，**有且只能有一个**。

> 为简化说明，后续文档里只会出现 `.ddnrc.js`。

比如：

```js
// .ddnrc.js
export default {
  publicPath: 'http://bar.com/foo',
  assets: [
    ['asset-aob', {
      assets: true,
    }],
  ],
};
```

具体配置项详见[配置](/zh/config/)。

## 优先级

总的原则是，`NODE_ENV`区分生产环境、开发环境，`DDN_ENV`区分物理环境（文件）。生产环境下，`*.mainnet.*`文件优先，其他环境下，优先级为 `*.local.*` > *.{DDN_ENV}.* > `*.testnet.*`。

  - 1、production: constants.mainnet.* [生产环境下最优先]
  - 2、local: constants.local.*
  - 3、custom: constants.{DdnEnv}.*
  - 4、development: constants.testnet.*;

## 本地配置

.ddnrc.local.js

`.ddnrc.local.js` 是本地的配置文件，**不要提交到 git**，所以通常需要配置到 `.gitignore`。

`.ddnrc.local.js` 默认有效。如果存在，会自动覆盖 `.ddnrc.js` 的同名配置，再返回。所以，你如果有个性化的本地配置，可以添加该文件，从而避免对正式配置文件的污染。

## 环境变量

### 1. NODE_ENV

程序默认是开发环境，即：非生产环境，`.ddnrc.local.js` 和 `.ddnrc.testnet.js` 起作用，且前者覆盖后者，`.ddnrc.mainnet.js` 不起作用。

如果设置 `NODE_ENV=production` ，程序将运行在生产环境下，`.ddnrc.local.js` 和 `.ddnrc.testnet.js` 将被`.ddnrc.mainnet.js`自动覆盖。

### 2. DDN_ENV

如果需要临时或定制化的环境配置，可以通过环境变量 `DDN_ENV` 区分，例如：针对不同物理环境（比如：cloud, custom）来指定配置。

举个例子，

```js
// .ddnrc.js
export default { a: 1, b: 2 };

// DDN_ENV=cloud -> .ddnrc.cloud.js
export default { b: 'cloud', c: 'cloud' };

// .ddnrc.local.js
export default { c: 'local' };
```

不指定 `DDN_ENV` 时，拿到的配置是：

```js
{
  a: 1,
  b: 2,
  c: 'local',
}
```

指定 `DDN_ENV=cloud` 时，拿到的配置是：

```js
{
  a: 1,
  b: 'cloud',
  c: 'local',
}
```

