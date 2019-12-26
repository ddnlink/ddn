# 配置

## 配置文件

DDN 允许在 `.ddnrc.js` ，`config/config.json` 或 `config/config.js`（三选一，`.ddnrc.js` 优先）中进行配置，支持 ES6 语法。

> 为简化说明，后续文档里只会出现 `.ddnrc.js`。

比如：

```js
export default {
  base: '/admin/',
  publicPath: 'http://cdn.com/foo',
  plugins: [
    ['umi-plugin-react', {
      dva: true,
    }],
  ],
};
```

具体配置项详见[配置](/zh/config/)。

## .ddnrc.local.js

`.ddnrc.local.js` 是本地的配置文件，**不要提交到 git**，所以通常需要配置到 `.gitignore`。如果存在，会和 `.ddnrc.js` 合并后再返回。

## DDN_ENV

可以通过环境变量 `DDN_ENV` 区分不同环境来指定配置。

举个例子，

```js
// .ddnrc.js
export default { a: 1, b: 2 };

// .ddnrc.cloud.js
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