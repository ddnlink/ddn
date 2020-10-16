---
id: ddn-base
title: 代码风格
sidebar_label: DDN Format
---

## 1. 说明

DDN 的代码规范基于`standard`，对 ES6 代码进行约束和格式化。因为开发过程中，最终需要对ES6代码进行编译，所以在编写代码的过程中，可以尽可能的简洁，比如，去掉大量的分号等。

## 2. 配置

- `editconfig` 是对编辑器的设置，可以对代码进行简单约束；
- `prittier` 是对代码格式的约束和规范；
- `eslint` 除了约束格式，还对一些具体编码方式进行进一步的约束，比`prittier`更深入一步；
- `husky` 和 `link-staged` 结合起来，可以将上述操作命令进行自动化；

目前，`eslint`有很多种流行的规范，比如：`standard`等，与`prittier`等有一些冲突，需要在使用中优化和设计，以便形成自己的规范格式。

### 2.1 prettier配置文件

prittier配置文件支持很多种，具体可以看这里。我使用的是.prettierrrc格式，因为试过其他格式，但是只有.prettierrrc，vscode才可以识别。
生成配置可以直接用官网上的try it out,左下角有导出配置。下面这份配置基本上是风格要求的全部了，具体可按照个人爱好进行配置。

```json
{
	"printWidth": 120, // 一行最大多少字符
	"tabWidth": 2, // tab占用的字符数
	"useTabs": false, // 是否使用tab代替空格
	"semi": false, // 是否每句后都加分号
	"singleQuote": true, // 是否使用单引号
	"jsxSingleQuote": false, // jsx是否使用单引号
	"trailingComma": "none", // 数组尾逗号， 或者 all
	"bracketSpacing": false, // {foo: xx}还是{ foo: xx }
	"jsxBracketSameLine": false, //看官网
	"arrowParens": "avoid", // 箭头函数参数是否使用（），也可以是 always
	"insertPragma": false
}
```

解决vscode eslint与prettier冲突，推荐修改 prettier 配置去适应老的 eslint 规则。 prettier 所有的配置。

### 2.2 eslint配置

```json
{
    "env": {
        "commonjs": true,
        "es6": true,
        "node": true,
        "jest": true,
        "browser": true // 如果不配置browser，window就会被eslint报undefined的错
    },
    "extends": [
        "standard", // "eslint:recommended" //  "airbnb-base" //
        // "plugin:prettier/recommended", // 重写冲突部分
        "prettier/standard"
    ],
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "ecmaVersion": 2018,
        "sourceType": "module"
    },
    "plugins": [
        "@typescript-eslint"
    ],
    "rules": {
        "camelcase": "off",
        "no-unused-expressions": "off"
    }
}
```
