---
title: 开发入门
toc: munu
---

# Get started

For developer, if you want to install mainnet peer, please visit [Peer install](./peer-install)

More infomation please visit our [official website](https://www.ddn.link) or [ddn-docs](http://docs.ddn.link)

## System Dependency

- nodejs v8+
- npm 5.3+
- node-gyp v3.6.2+ 
- sqlite v3.8.2+
- mysql 5.0+
- g++
- libssl

## Installation for ubuntu 16.04.x or higher

Development

```
# Update
apt update

# Install dependency package
sudo apt-get install curl sqlite3 ntp wget git libssl-dev openssl make gcc g++ autoconf automake python build-essential libtool libtool-bin -y
```

## Install Node.js

```
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash
# This loads nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" 
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

# Install node and npm for current user.
nvm install node 10.21.0
# check node version and it should be v10.x.x
node --version
```

## Install DDN peer (Development)

```
# git clone sourece code
git clone https://github.com/ddnlink/ddn-starter.git && cd ddn-starter 

# Install node packages
npm install --production 

# config
$ chmod u+x ddnd && ./ddnd configure

# start
$ ./ddnd start  // or `node app.js`
```

## Install for Mac 10.01.x or higher

```
# Install dependency package
brew install curl sqlite3 ntp wget git libssl-dev openssl make gcc g++ autoconf libtool libtool-bin -y

# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash
# This loads nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" 
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

# Install node and npm for current user.
nvm install node 10
# check node version and it should be v10.x.x
node --version

# git clone sourece code
git clone https://github.com/ddnlink/ddn-starter.git && cd ddn-starter && chmod u+x ddnd

# Install node packages
npm install --production
```

## Install for Windows with docker

If you are a Dapp Developer, you can install DDN peer on your Linux or Mac

[Install Docker firstly](https://store.docker.com/search?offering=community&type=edition)

```
# build DDN image
$ docker build -t ddnlink/ddn:v3.5.0 .

# or pull
$ docker pull ddnlink/ddn:v3.5.0
```

```
# run docker
$docker run -it --name ddn -p 8001:8001 ddnlink/ddn:v3.5.0 /bin/bash
root@e149b6732a48:/ddn# ./ddnd start
DDN server is running ...
```

## Run 

```
cd DDN && yarn start // or npm start
or
cd DDN && ./ddnd start
```

## Access in browser

Then open `http://localhost:8001/api/blocks/getStatus` in your browser

## Usage

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

## Get DDNs for test

Any behavior on the blockchain requires amounts of digital assets. You can automatically obtain DDNs of testnet through the following activities for development and testing. Scan the QR code on the follow image with your mobile phone

<img src="../images/datm.jpg" width="200px">

> PS：DATM is a distributed task management tool based on DDN blockchain. You can get tasks and discuss problems. When you complete tasks, The system will pay you DDN through the smart contract.

## Test

Start server firstly.
```
cd DDN && yarn start
```

Then, test
```
$ yarn test
```

## Releated projects

- [ddn-docs](https://github.com/ddnlink/ddn-docs)
- [ddn](https://github.com/ddnlink/ddn)
- [js-sdk](https://github.com/ddnlink/ddn/packages/js-sdk)
- [node-sdk](https://github.com/ddnlink/node-sdk)
- [ddn-explorer] website: [ddn.link](http://mainnet.ddn.link)

## License

The MIT License (MIT)

Copyright (c) 2016-2019 DDN.link. All rights reserved. See License.txt in the project root for license information.