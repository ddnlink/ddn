# DDN cli

A command line tool to manage [DDN](https://github.com/ddnlink) blockchain apps.

## Installation

```
$ yarn global add @ddn/ddn
```

or

```
$ npm install -g @ddn/ddn
```

## Usage

```bash
$ ddn

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

## Documents

[ddn-docs](http://docs.ddn.net/guide/ddn-cli)
