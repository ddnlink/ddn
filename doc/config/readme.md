---
sidebarDepth: 2
---

# 配置

## 基本配置

### 资产插件

- 类型：`Array`
- 默认值：`[]`

配置插件列表。

数组项为指向插件的路径，可以是 npm 依赖、相对路径或绝对路径。如果是相对路径，则会从项目根目录开始找。比如：

```js
export default {
  plugins: [
    // npm 依赖
    'asset-aob',
    // 相对路径
    './plugin',
    // 绝对路径
    `${__dirname}/plugin.js`,
  ],
};
```

如果插件有参数，则通过数组的形式进行配置，第一项是路径，第二项是参数，类似 babel 插件的配置方式。比如：

```js
export default {
  plugins: [
    // 有参数
    [
      'asset-aob',
      {
        a: true,
        b: true,
      },
    ],
    './plugin',
  ],
};
```