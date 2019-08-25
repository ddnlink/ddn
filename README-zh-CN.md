[中文版](./README-zh-CN.md) | [英文版](./README.md)

# DDN

DDN, 数据分发网络, 是一个成熟的区块链系统，已经服务于版权存证、检验检测、电子医疗等10多个领域。

更多信息，请查看 [官网](https://www.ddn.link)

## 系统依赖

- nodejs v8+
- npm 5.3+
- node-gyp v3.6.2+ 
- sqlite v3.8.2+，mysql 5.0+
- g++
- libssl

## 操作系统

1. Linux系统：ubuntu 16.04.x or higher

```
# 安装依赖
sudo apt-get install curl sqlite3 ntp wget git libssl-dev openssl make gcc g++ autoconf automake python build-essential libtool libtool-bin -y

# 安装nvm
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.2/install.sh | bash
# This loads nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" 
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

# 安装 node 和 npm .
nvm install node 8
# check node version and it should be v8.x.x
node --version

# 克隆代码
git clone https://github.com/ddnlink/ddn.git && cd ddn && chmod u+x ddnd

# 安装 node 包
npm install
```

2. 苹果系统：Mac 10.01.x or higher

```
# 安装依赖包
brew install curl sqlite3 ntp wget git libssl-dev openssl make gcc g++ autoconf libtool libtool-bin -y

# 安装 nvm
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.2/install.sh | bash
# This loads nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" 
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

# 安装 node 和 npm .
nvm install node 8
# check node version and it should be v8.x.x
node --version

# 克隆代码
git clone https://github.com/ddnlink/ddn.git && cd ddn && chmod u+x ddnd

# 安装 node 包
npm install
```

## 启动DDN

```
cd DDN && node app.js
or
cd DDN && ./ddnd start
```

## 使用

```
node app.js --help

  Usage: app [options]

  Options:

    -h, --help                 output usage information
    -V, --version              output the version number
    -c, --config <path>        Config file path
    -p, --port <port>          Listening port number
    -a, --address <ip>         Listening host name or ip
    -b, --blockchain <path>    Blockchain db path
    -g, --genesisblock <path>  Genesisblock path
    -x, --peers [peers...]     Peers list
    -l, --log <level>          Log level
    -d, --daemon               Run DDN node as daemon
    --reindex                  Reindex blockchain
    --base <dir>               Base directory
```

## 默认本地创世账户

**注**: 请使用`D`、`E`等代替下面地址里的 [*]  

```
{
  "keypair": {
    "publicKey": "2e6d978c5e6f1fbfc5a27abd964d9b6adc352daa81e31d9098a4f5ee3d7f885e",
    "privateKey": "863669059023e53d46d92b6a1a7bdaa8a9ff3555d98c07517c2a3a08c89ff9d02e6d978c5e6f1fbfc5a27abd964d9b6adc352daa81e31d9098a4f5ee3d7f885e"
  },
  "address": "[*]CE3q83WTqk58Y3hU9GDStn7MmqWU9xHbK",
  "secret": "enter boring shaft rent essence foil trick vibrant fabric quote indoor output"
}
```

## 相关工程

- [ddn-docs](https://github.com/ddnlink/ddn-docs)
- [ddn-cli](https://github.com/ddnlink/ddn-cli)
- [ddn-node-sdk](https://github.com/ddnlink/ddn-node-sdk)
- [ddn-explorer] website: [ddn.link](http://mainnet.ddn.link)

## 协议

The MIT License (MIT)

Copyright (c) 2016-2019 DDN.link. All rights reserved. See License.txt in the project root for license information.
