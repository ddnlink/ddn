# DDN js Library

## About 关于

这是 DDN javascript SDK，兼容浏览器端

## Install 安装

```
npm install @ddn/js-sdk --save
```

## Usage 使用

### 基本用法

只要基于 ES6 开发，浏览器端可以这样调用

```javascript
// 初始化网络标示以及加密算法
import DdnJS from '@ddn/js-sdk';
// 加密算法 是['@ddn/crypto-nacl', '@ddn/crypto-sm']其中之一默认为@ddn/crypto-nacl

// 初始化配置和常量
const { config, constants } = DdnJS.init({
  net: 'mainnet', // 指定网络类型：'mainnet' 或 'testnet'
  // 其他配置项...
});

// 也可以使用 setup 方法（向后兼容）
// const { config, constants } = DdnJS.setup({ net: 'mainnet' });

// 浏览器端也可以使用全局配置
window.DdnJS = window.DdnJS || {};
window.DdnJS.config = {
  net: 'mainnet',
  // 其他配置项...
};

// 然后在代码中初始化
const { config, constants } = DdnJS.init();
```

### 配置管理

从版本 2.5.0 开始，DDN SDK 提供了全新的配置管理机制，特别是网络类型（mainnet/testnet）的设置。以下是几种配置方法：

#### 1. 使用环境变量

可以通过设置环境变量 `DDN_NET` 来指定网络类型：

```bash
# 设置为主网
DDN_NET=mainnet node your-app.js

# 设置为测试网
DDN_NET=testnet node your-app.js

# 如果需要调试，可以添加 DEBUG 环境变量
# 这将显示配置合并过程的详细信息
DDN_NET=mainnet DEBUG=debug node your-app.js
```

注意：环境变量 `DDN_NET` 拥有最高优先级，会覆盖其他所有配置方式设置的网络类型。

#### 2. 使用 init 方法

在初始化时使用 `init` 方法指定配置：

```javascript
import DdnJS from '@ddn/js-sdk';

// 初始化时设置网络类型为主网
const { config, constants } = DdnJS.init({
  net: 'mainnet',
  // 其他配置项...
});

// 注意：为了向后兼容，也可以使用 setup 方法
// const { config, constants } = DdnJS.setup({ net: 'mainnet' });

// 使用配置和常量
console.log(config.net); // 'mainnet'
console.log(constants.nethash); // 网络的 nethash 值
```

#### 3. 使用全局配置

可以使用 `setGlobalConfig` 方法在应用启动时设置全局配置：

```javascript
import DdnJS from '@ddn/js-sdk';

// 设置全局配置
DdnJS.setGlobalConfig({
  net: 'mainnet',  // 设置网络类型为主网
  // 其他配置...
});

// 之后使用 init 方法时会自动使用上面设置的全局配置
const { config, constants } = DdnJS.init();
```

#### 4. 直接设置网络类型

可以使用 `setNetworkType` 方法直接设置网络类型：

```javascript
import DdnJS from '@ddn/js-sdk';

// 直接设置网络类型为主网
DdnJS.setNetworkType('mainnet');

// 或者设置为测试网
// DdnJS.setNetworkType('testnet');
```

#### 5. 使用配置管理器

可以直接访问配置管理器进行更细粒度的控制：

```javascript
import DdnJS from '@ddn/js-sdk';

// 直接使用配置管理器
DdnJS.configManager.setNetworkType('mainnet');

// 获取当前配置
const currentConfig = DdnJS.configManager.config;

// 获取当前常量
const currentConstants = DdnJS.configManager.constants;
```

### 配置优先级

当多种配置方式同时存在时，配置的优先级从高到低为：

1. **环境变量** (`DDN_NET`)
   - 环境变量拥有最高优先级，会覆盖其他所有配置方式

2. **init() 方法传入的配置**
   - 直接传入 `init()` 方法的配置项优先级仅次于环境变量
   - 注意：`setup()` 方法与 `init()` 方法功能相同，但推荐使用 `init()`

3. **全局配置**
   - 通过 `setGlobalConfig()` 或 `setNetworkType()` 设置的全局配置
   - 在浏览器环境中，`window.DdnJS.config` 也属于全局配置

4. **用户配置文件**
   - 在 Node.js 环境中，`.ddnrc.js` 或 `config/config.js` 文件中的配置

5. **默认配置**
   - SDK 内置的默认配置，当没有其他配置时使用

这种优先级机制确保了在各种环境下都能正确设置网络类型，并且配置的更改会立即影响到常量的选择。

### 重要提示

使用 js-sdk 时，必须先调用 `init()` 方法初始化配置，才能正确使用常量和其他功能。例如：

```javascript
import DdnJS from '@ddn/js-sdk';

// 错误的用法 - 没有初始化
const nethash = DdnJS.constants.nethash; // 错误！constants 不存在

// 正确的用法 - 先初始化
const { constants } = DdnJS.init();
const nethash = constants.nethash; // 正确

// 也可以使用 setup 方法（向后兼容）
// const { constants } = DdnJS.setup();
// const nethash = constants.nethash;
```

Please reference the [DDN http interface documents](https://github.com/ddnlink/ddn-docs/js-sdk-api.md)

## Develop 开发

注意的是，不建议在其他组件里调用本包，避免循环引用；同时，本包使用的 Http Api，所以不需要引入资产包。

## Release 发布

每次修改发布，请执行一次如下命令，**目前主流浏览器都支持 ES6 模块化，所以不需要使用 UMD 模块化，也不需要打包**

```sh
# 生产网络 DDN_NAME=ddn
$ cd /path/to/ddn/
$ pnpm build --filter @ddn/js-sdk

# 测试网络 DDN_NAME=dev
$ cd /path/to/ddn/packages/js-sdk
$ pnpm build:dev # 生成测试网络的sdk

# 建议的做法
$ DDN_NAME=ddn pnpm build # 生成主网网络的sdk
$ DDN_NAME=dev pnpm build # 测试网络的sdk
```