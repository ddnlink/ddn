---
title: 命令行工具
order: 1
---

# 命令行工具

## 简介

从 DDN v3.0.0 以后，我们的命令行工具`ddn`名称正式更改为`ddn`，也就是说，通过命令行操作的命令与实际运行的程序将保持一致，都是`ddn`.

同时，DDN v3.6.0 版本之后，DDN 区块链命令行工具采取分级、分类管理的方法进行了彻底重构，您可以像使用 `git` 命令那样使用`ddn`了，体验上有了很大提升。

## 说明

### 分类

整体上，命令包含了 6 个类别的子命令，它们是：`account`、`block` `dapp` `delegate` `dev` `transaction`，列表对比说明如下：

|序号 | 类别或子命令 | 简称 | 备注 |
|--------|---------|-----------|---------|
|  1  | account   | a | 账户子命令，包括创建账户、登录账户等 |
|  2  | block   | b, block, chain | 块子命令，包括检索块高度、查询块状态等 |
|  3  | transaction   | t, trs | 交易子命令，包括转账、检索交易等命令 |
|  4  | delegate   | d | 节点相关子命令，受托人、节点、IP等 |
|  5  | dapp   | 无 | Dapp子命令，包括资产转账等 |
|  6  | dev   | 无 | 开发子命令，包括新建链、智能合约等命令 |

简称的逻辑是：

- 首字母简写，同类别、同级别出现重复时使用全称；
- 提供其他习惯的名称，比如：有人喜欢将`delegate`与`peer`等同，`peer`也自然可以作为它的命令简称。

用法案例：

```shell
imfly@MacBook DDN % ddn
ddn <命令>

命令：
  ddn account [command]      DDN account manage tools.              [aliases: a]
  ddn block [command]        DDN block manage tools.  [aliases: b, block, chain]
  ddn dapp [command]         DDN dapp manage tools.
  ddn delegate [command]     DDN delegate manage tools.       [aliases: d, peer]
  ddn dev [command]          DDN develop tools.
  ddn transaction [command]  DDN transaction manage tools.     [aliases: t, trs]

选项：
      --version  显示版本号                                               [布尔]
  -H, --host     Specify the hostname or ip of the node    [默认值: "127.0.0.1"]
  -P, --port     Specify the port of the node                     [默认值: 8001]
  -M, --main     Specify the mainnet, default: false
  -h, --help     显示帮助信息                                             [布尔]

copyright 2020
```

### 分级

每个类别下面有多个子命令，您只要使用`ddn a -h`(等同于`ddn account -h`）的方式检索查看即可

用法案例：

```shell
imfly@MacBook DDN % ddn a -h
ddn account [command]

DDN account manage tools.

命令：
  ddn a getAccount [address]                Get account by address
                                                              [aliases: account]
  ddn a getBalance [address]                Get balance by address
                                                              [aliases: balance]
  ddn a lock                                Lock account to ban transfer ...
                                                                    [aliases: l]
  ddn a openAccount [secret]                Open your account and get the
                                            infomation by secret
                                                              [aliases: o, open]
  ddn a openAccountByPublicKey [publickey]  Open your account and get the
                                            infomation by publickey
                                                                 [aliases: oabp]
  ddn a setSecondSecret                     Set second secret     [aliases: sss]

选项：
      --version  显示版本号                                               [布尔]
  -H, --host     Specify the hostname or ip of the node    [默认值: "127.0.0.1"]
  -P, --port     Specify the port of the node                     [默认值: 8001]
  -M, --main     Specify the mainnet, default: false
  -h, --help     显示帮助信息                                             [布尔]
```


## 公共选项

所有命令所默认请求的`host`,`port`,以及网络类型`main`等是它们的公共选项，以大写字母的形式提供。它们就是：

```shell
选项：
      --version  显示版本号                                               [布尔]
  -H, --host     Specify the hostname or ip of the node    [默认值: "127.0.0.1"]
  -P, --port     Specify the port of the node                     [默认值: 8001]
  -M, --main     Specify the mainnet, default: false
  -h, --help     显示帮助信息   
```

## 参考

更多应用案例，请参考 《DDN-UBL 高校实验教程》