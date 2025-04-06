项目构建
--------

## 概述

DDN 项目大多是 node.js 的后台应用，也就是 commonjs 项目，所以只要构建 cjs 规范的工具就可以。当然，在这个过程中，有 @ddn/js-sdk 是面向前端的，需要做 ESM 的转换（支持 IE11 以上，直接使用 esbuild 转换即可，与 cjs 难度一样）。更重要的是，有 @ddn/contract 等，是面向企业的，需要做 bundler 处理，将其打包、压缩并混淆，需要使用 UMD 格式，处理的事情会多一些。

综上所属，vite、umi 这类面向前端的打包构建工具是不适用的，只能寻求更加底层的打包工具，目前是 father4 ，它封装了 EsBuild 和 webpack 等工具，并且支持CJS、ESM和UMD的转换。但是，也需要配合 babel 等工具进行更加细致的处理。 

在此基础上，再使用 turbo、pnpm 等多包管理工具，才能构建起完整的打包和开发工具链。

## 参考

- [rollup/parcel/esbuild](https://cloud.tencent.com/developer/article/2030300)
- [umijs -> vite](https://juejin.cn/post/7033243995425734663)
- [vite](https://vitejs.cn/vite3-cn/guide/)
- [Corepack - 解决 pnpm 或 yarn 的多版本管理、解决本地版本与 packageManager 中的版本一致性问题](https://ksh7.com/posts/node-corepack/index.html)
- [pnpm 如何使用 workspace 构建 monorepo](https://ksh7.com/posts/pnpm-use-workspace/index.html)

## 结论

- esbuild 专注、快，但扩展不足；
- webpack 老牌、全，但速度太慢，不支持 esm 格式；
- rollup  专注模块、快，但 cjs 支持的不好，cjs2esm 效果不好
- parcel 了解的少

**什么是bundler**
bundler的工作就是将一系列通过模块方式组织的代码将其打包成一个或多个文件，我们常见的bundler包括webpack、rollup、esbuild等。 

webpack :强调对web开发的支持，尤其是内置了HMR的支持，插件系统比较强大，对各种模块系统兼容性最佳(amd,cjs,umd,esm等，兼容性好的有点过分了，这实际上有利有弊,导致面向webpack编程），有丰富的生态，缺点是产物不够干净，产物不支持生成esm格式， 插件开发上手较难，不太适合库的开发。
rollup: 强调对库开发的支持，基于ESM模块系统，对tree shaking有着良好的支持，产物非常干净，支持多种输出格式，适合做库的开发，插件api比较友好，缺点是对cjs支持需要依赖插件，且支持效果不佳需要较多的hack，不支持HMR，做应用开发时需要依赖各种插件。
parcel：强调极速零配置Web应用打包工具，它利用多核处理提供了极快的速度，并且不需要任何配置。  
esbuild: 强调性能，内置了对css、图片、react、typescript等内置支持，编译速度特别快（是webpack和rollup速度的100倍+),缺点是目前插件系统较为简单，生态不如webpack和rollup成熟。

## 工具

1. 为什么不选择 rollup？

https://cloud.tencent.com/developer/article/2030300

- 对CommonJS的兼容问题

因为rollup原生只支持ESM模块的bundle，因此如果实际业务中需要对commonjs进行bundle，第一步就是需要将CJS转换成ESM，不幸的是，Commonjs和ES Module的interop问题是个非常棘手的问题（搜一搜babel、rollup、typescript等工具下关于interop的issue：https://sokra.github.io/interop-test/

其两者语义上存在着天然的鸿沟，将ESM转换成Commonjs一般问题不太大（小心避开default导出问题），但是将CJS转换为ESM则存在着更多的问题。 实际上rollup也正在重写该核心模块：https://github.com/rollup/plugins/pull/658。 

- 一些典型的问题如下

由于commonjs的导出模块并非是live binding的，所以导致一旦出现了commonjs的循环引用，则将其转换成esm就会出问题
同步的动态require几乎无法转换为esm，如果将其转换为top-level的import，根据import的语义，bundler需要将同步require的内容进行hoist，但是这与同步require相违背，因此动态require也很难处理
cjs2esm的复杂性，导致该转换算法十分复杂，导致一旦业务里包含了很多cjs的模块，rollup其编译性能就会急剧下降，这在编译一些库的时候可能不是大问题，但是用于大型业务的开发，其编译速度难以接受。

## 发布

```bash
$ pnpm login // 登录

$ pnpm version patch // 升级版本号
$ pnpm version minor // 升级版本号
$ pnpm version major // 升级版本号

$ pnpm publish --access public -no-git-checks --dry-run // 测试
$ pnpm publish --access public -no-git-checks // 正式发布

$ npm deprecate @ddn/contract@0.4.1 "This version is deprecated, please upgrade to 0.4.2 or higher"
```