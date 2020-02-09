# DDN Client

A command line tool to manage [DDN](https://github.com/ddnlink) blockchain apps.

## Installation

由于依赖的inquirer模块在低版本node下存在bug
最新的dapps系列子命令要求node版本号为v8.4.0以上

```
npm install -g @ddn/ddn
```

## Usage

```
$ ddn

Usage:  [options] [command]

Options:
  -V, --version                          output the version number
  -H, --host <host>                      Specify the hostname or ip of the node, default: 127.0.0.1 (default: "127.0.0.1")
  -P, --port <port>                      Specify the port of the node, default: 8001 (default: 8001)
  -M, --main                             Specify the mainnet, default: false
  -h, --help                             output usage information

Commands:
  getHeight                              get block height
  getBlockstatus                         get block status
  openAccount [secret]                   open your account and get the infomation by secret
  openAccountByPublickey [publickey]     open your account and get the infomation by publickey
  getBalance [address]                   get balance by address
  getAccount [address]                   get account by address
  getVotedDelegates [options] [address]  get delegates voted by address
  getDelegatesCount                      get delegates count
  getDelegates [options]                 get delegates
  getVoters [publicKey]                  get voters of a delegate by public key
  getDelegateByPublickey [publicKey]     get delegate by public key
  getDelegateByUsername [username]       get delegate by username
  getBlocks [options]                    get blocks
  getBlockById [id]                      get block by id
  getBlockByHeight [height]              get block by height
  getPeers [options]                     get peers
  getUnconfirmedTransactions [options]   get unconfirmed transactions
  getTransactions [options]              get transactions
  getTransaction [id]                    get transactions
  sendToken [options]                    send token to some address
  sendAsset [options]                    send asset to some address
  registerDelegate [options]             register delegate
  listDiffVotes [options]                list the votes each other
  upVote [options]                       vote for delegates
  downVote [options]                     cancel vote for delegates
  setSecondsecret [options]              set second secret
  registerDapp [options]                 register a dapp
  deposit [options]                      deposit assets to an app
  dappTransaction [options]              create a dapp transaction
  lock [options]                         lock account transfer
  getFullBlockById [id]                  get full block by block id
  getFullBlockByHeight [height]          get full block by block height
  getTransactionBytes [options]          get transaction bytes
  getTransactionId [options]             get transaction id
  getBlockBytes [options]                get block bytes
  getBlockPayloadHash [options]          get block bytes
  getBlockId [options]                   get block id
  verifyBytes [options]                  verify bytes/signature/publickey
  generate|g <asset> <name>              generate new blockchain
  contract [options]                     contract operations
  crypto [options]                       crypto operations
  dapps [options]                        manage your dapps
  createGenesis [options]                create genesis block
  peerStat                               analyze block height of all peers
  delegateStat                           analyze delegates status
  ipStat                                 analyze peer ip info
  createUsers [options]                  create some accounts
```

## Documents

[ddn-docs](https://github.com/ddnlink/ddn-docs)
