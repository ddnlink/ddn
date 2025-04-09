FAQ
-----



## 1. 在 git cz 进行提交的时候，出现 --no-install is not in the npm registry 错误

原因是 husky 版本过低了，但是简单安装是无效的，需要这样：

```shell
$ pnpm dlx husky install
```

命令很奇特吧

## 2. 区块生成被阻塞问题

**问题描述：**  
节点日志中不断显示 "Skipping block generation - pending block exists" 警告，区块链停滞在某个高度，无法继续生成新区块。例如：
```log
warn 15:32:34.66 block.js:833 (Block.generateBlock) Skipping block generation - pending block exists
```

原因分析：

1. 区块投票(propose)已生成但未获得足够的投票数
2. 当前配置要求投票数(voters)为67个，但实际网络中只能收到61个投票
3. 由于投票数不足以达到共识要求，导致区块无法最终确认
解决方案：

1. 修改 constants.js 中的投票数配置：

```js
module.exports = {
  delegates: 101,
  superPeers: 21,
  voters: 61,        // 修改为实际可获得的投票数
  remoteVoters: 6,
}
```

2. 清理节点缓存：

```shell
# 停止节点
./ddnd stop peer-8002

# 清理区块缓存和pending状态
rm -rf /Users/imfly/projects/DDN/ddn/examples/peer-8002/db/pending*

# 重启节点
./ddnd start peer-8002
```

注意事项：

- 修改配置后必须重启节点才能生效
- 建议在测试网络中先验证修改效果
- 生产环境中需要协调所有节点同时更新配置
- 执行清理操作前请确保已备份重要数据


## 3. 大数处理中 toFixed() 和 toString() 的正确使用

**问题描述：**  
在区块链数值处理中，`bignum`计算结果的格式化方式选择不当可能导致精度丢失或格式不一致问题。

**方法对比：**

| 方法       | 作用                          | 适用场景                          | 示例                          |
|------------|-----------------------------|---------------------------------|-----------------------------|
| `toFixed()` | 转换为指定位数小数的字符串            | 需要固定小数位数的金额/数值处理          | `bignum(1.23).toFixed(8)` → "1.23000000" |
| `toString()` | 转换为最简形式的字符串               | 不需要特定小数位数的普通数值转换          | `bignum(1.2300).toString()` → "1.23" |

**使用规范：**

1> **金额计算**必须使用`toFixed()`指定小数位数：

```javascript
const amount = bignum(10).toFixed(8); // "10.00000000"
```

2> 区块高度/轮次 等整数值使用无参数 toFixed() ：

const height = bignum(1000).toFixed(); // "1000"

3> 临时计算/中间值 可使用 toString() ：


const temp = bignum(a).plus(b).toString();

4> 数据库存储 统一使用 toFixed() 保证格式一致

注意事项：

- 避免混用两种方法导致精度不一致
- 金额相关操作必须指定小数位数（通常8位）
- 整数运算使用无参数 toFixed()
- 所有最终存储的数据必须经过格式化处理

## 4. pnpm链接出了问题，每次需要重新pnpm install才可以生效，为什么？怎么改进？

pnpm link 后需要重新 pnpm install 才能生效，这通常是由以下几个原因造成的：

#### 原因分析
1> pnpm 的硬链接机制 ：
   
   - pnpm 使用硬链接来共享依赖，直接修改 node_modules 中的文件可能不会立即反映到项目中
   - 特别是当使用 pnpm link 时，链接的包可能被缓存或隔离
2> MFSU 缓存问题 ：
   
   - Umi 项目默认使用 MFSU (Module Federation Speed Up) 会缓存依赖
   - 如您之前看到的 FAQ 文档提到的，需要排除链接的包
3> 依赖解析顺序 ：
   
   - pnpm 会优先使用项目本地的 node_modules 而非全局链接的包
#### 1> 解决方案
1> 修改 Umi 配置排除链接包 ：
   在 .umirc.ts 中添加：
```typescript
export default {
  mfsu: {
    exclude: ['@ddn/js-sdk']
  }
}
```

#### 2> 使用 pnpm link --global 替代 ：

# 在 js-sdk 项目中
pnpm link --global

# 在 ddn-wallet-u2 项目中
pnpm link --global @ddn/js-sdk

#### 3> 添加 watch 脚本自动同步 ：
在 package.json 中添加开发脚本：

{
  "scripts": {
    "dev:watch": "pnpm run build && chokidar 'node_modules/@ddn/js-sdk/**/*' -c 'pnpm run build'"
  }
}

#### 4> 使用 pnpm overrides 强制版本 （推荐）：
在 package.json 中指定覆盖：

{
  "pnpm": {
    "overrides": {
      "@ddn/js-sdk": "link:../ddn/packages/js-sdk"
    }
  }
}

#### 最佳实践建议
1. 对于频繁修改的本地依赖，推荐使用 pnpm overrides 方式
2. 开发时可以使用 pnpm dev --no-mfsu 临时禁用 MFSU
3. 每次修改依赖后运行 pnpm install --force 强制更新
这些修改应该能解决您遇到的链接不生效问题，同时保持开发环境的稳定性。

## 5. node_sqlite3.node 找不到的问题
**问题描述：**
在使用 node_sqlite3 模块时，可能会遇到找不到 node_sqlite3.node 文件的错误。原因是安装的时候没有下载成功，或者没有编译成功。

例如：

```
(base) imfly@imflydeMac-mini ddn % node -e 'require("sqlite3")'
/Users/imfly/Documents/projects/DDN/ddn/node_modules/.pnpm/bindings@1.5.0/node_modules/bindings/bindings.js:135
  throw err;
  ^

Error: Could not locate the bindings file. Tried:
 → /Users/imfly/Documents/projects/DDN/ddn/node_modules/.pnpm/sqlite3@5.1.7/node_modules/sqlite3/addon-build/default/install-root/node_sqlite3.node
 → /Users/imfly/Documents/projects/DDN/ddn/node_modules/.pnpm/sqlite3@5.1.7/node_modules/sqlite3/lib/binding/node-v108-darwin-arm64/node_sqlite3.node
    at bindings (/Users/imfly/Documents/projects/DDN/ddn/node_modules/.pnpm/bindings@1.5.0/node_modules/bindings/bindings.js:126:9)
    at Object.<anonymous> (/Users/imfly/Documents/projects/DDN/ddn/node_modules/.pnpm/sqlite3@5.1.7/node_modules/sqlite3/lib/sqlite3-binding.js:1:37)
    at Module._compile (node:internal/modules/cjs/loader:1364:14)
    at Module._extensions..js (node:internal/modules/cjs/loader:1422:10)
    at Module.load (node:internal/modules/cjs/loader:1203:32)
    at Module._load (node:internal/modules/cjs/loader:1019:12)
    at Module.require (node:internal/modules/cjs/loader:1231:19)
    at require (node:internal/modules/helpers:177:18)
    at Object.<anonymous> (/Users/imfly/Documents/projects/DDN/ddn/node_modules/.pnpm/sqlite3@5.1.7/node_modules/sqlite3/lib/sqlite3.js:2:17)
    at Module._compile (node:internal/modules/cjs/loader:1364:14) {
  tries: [
    '/Users/imfly/Documents/projects/DDN/ddn/node_modules/.pnpm/sqlite3@5.1.7/node_modules/sqlite3/build/node_sqlite3.node',
    '/Users/imfly/Documents/projects/DDN/ddn/node_modules/.pnpm/sqlite3@5.1.7/node_modules/sqlite3/build/Debug/node_sqlite3.node',
    '/Users/imfly/Documents/projects/DDN/ddn/node_modules/.pnpm/sqlite3@5.1.7/node_modules/sqlite3/build/Release/node_sqlite3.node',
    '/Users/imfly/Documents/projects/DDN/ddn/node_modules/.pnpm/sqlite3@5.1.7/node_modules/sqlite3/out/Debug/node_sqlite3.node',
    '/Users/imfly/Documents/projects/DDN/ddn/node_modules/.pnpm/sqlite3@5.1.7/node_modules/sqlite3/Debug/node_sqlite3.node',
    '/Users/imfly/Documents/projects/DDN/ddn/node_modules/.pnpm/sqlite3@5.1.7/node_modules/sqlite3/out/Release/node_sqlite3.node',
    '/Users/imfly/Documents/projects/DDN/ddn/node_modules/.pnpm/sqlite3@5.1.7/node_modules/sqlite3/Release/node_sqlite3.node',
  ]
}
```

**解决方法：**

请看 ['script/copy_sqlite3.js'](../script/copy_sqlite3.js) 脚本
