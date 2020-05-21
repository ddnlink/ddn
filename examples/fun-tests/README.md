[中文版](./README-zh-CN.md) | [English](./README.md)

# DDN

DDN, Data Delivery Network, is next generation blockchain system.

More infomation please visit our [official website](https://www.ddn.link) or [ddn-docs](https://github.com/ddnlink/ddn-docs)

## System Dependency

- nodejs v8+
- npm 5.3+
- node-gyp v3.6.2+ 
- sqlite v3.8.2+
- mysql 5.0+
- g++
- libssl

## Installation for ubuntu 16.04.x or higher

```
# Install dependency package
sudo apt-get install curl sqlite3 ntp wget git libssl-dev openssl make gcc g++ autoconf automake python build-essential libtool libtool-bin -y

# Install nvm
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.2/install.sh | bash
# This loads nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" 
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

# Install node and npm for current user.
nvm install node 8
# check node version and it should be v8.x.x
node --version

# git clone sourece code
git clone https://github.com/ddnlink/ddn.git && cd ddn && chmod u+x ddnd

# Install node packages
npm install
```

## Installation for Mac 10.01.x or higher

```
# Install dependency package
brew install curl sqlite3 ntp wget git libssl-dev openssl make gcc g++ autoconf libtool libtool-bin -y

# Install nvm
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.2/install.sh | bash
# This loads nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" 
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

# Install node and npm for current user.
nvm install node 8
# check node version and it should be v8.x.x
node --version

# git clone sourece code
git clone https://github.com/ddnlink/ddn.git && cd ddn && chmod u+x ddnd

# Install node packages
npm install
```

## Run 

```
cd DDN && yarn start // or npm start
or
cd DDN && ./ddnd start
```

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
## Default localnet genesis account

**Note**: You can replace the [*] of the address with `D`、`E`...

```
// Gaccount:
{
  "keypair": {
    "publicKey": "daeee33def7eef0c7ba06ec66eda7204437ba88ace8f04e4a6aa4d7bfbd18bc1",
    "privateKey": "cd4737a82bc9525fb763452bc0dd34585454cd5ed301dbcde2b7ba3478a8d32cdaeee33def7eef0c7ba06ec66eda7204437ba88ace8f04e4a6aa4d7bfbd18bc1"
  },
  "address": "[*]C5kJzMdNDhrnupWX2NGafzMoiwdHiySBe", // before version 3.3.0：[*]CE3q83WTqk58Y3hU9GDStn7MmqWU9xHbK
  "secret": "enter boring shaft rent essence foil trick vibrant fabric quote indoor output",
  "nethash": "0ab796cd"
}

// Daccount:
{
  "address": "DA2atc9kiaGXJa34s6VGh3b81WZe3tqpD",
  "publicKey": "905ad2f41a99cd994e6efa32351d08109bc7a55e09d2c6946661c9011d053b82",
  "password": "always mix crane height attract crack school barrel valve control depend year"
}

// Eaccount:
{
  "address": "D9EWvxNF89StC8UAS3WHrgXX8fCGyAaoU",
  "publicKey": "afa5f212a588e861132543d9d31e67b06fb6b6e25ce796cc42dde4e6affc4209",
  "password": "worth false mirror digital clerk repair search neck joke patient village crumble"
}
```

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
- [node-sdk](https://github.com/ddnlink/node-sdk)
- [ddn-explorer] website: [ddn.link](http://mainnet.ddn.link)

## License

The MIT License (MIT)

Copyright (c) 2016-2019 DDN.link. All rights reserved. See License.txt in the project root for license information.
