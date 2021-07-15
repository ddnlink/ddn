import fs from 'fs'
import path from 'path'
import * as DdnCrypto from '@ddn/crypto'
import NodeSdk from '@ddn/node-sdk'
import { Compiler, GasCounter } from '@ddn/contract'
import Api from '../helpers/api'
import blockHelper from '../helpers/block'

let globalOptions

// 调用其他方法之前需要初始化全局选项
function init (options) {
  globalOptions = options
}

function getApi () {
  return new Api({ host: globalOptions.host, port: globalOptions.port, mainnet: !!globalOptions.main })
}

function pretty (obj) {
  return JSON.stringify(obj, null, 2)
}

function openAccount (secret) {
  getApi().post('/api/accounts/open', { secret: secret }, function (err, result) {
    console.log(err || pretty(result.account))
  })
}

function openAccountByPublicKey (publicKey) {
  getApi().post('/api/accounts/open2', { publicKey: publicKey }, function (err, result) {
    console.log(err || pretty(result.account))
  })
}

function getHeight () {
  getApi().get('/api/blocks/getHeight', function (err, result) {
    console.log(err || result.height)
  })
}

function getBlockStatus () {
  getApi().get('/api/blocks/getStatus', function (err, result) {
    console.log(err || pretty(result))
  })
}

function getBalance (address) {
  var params = { address: address }
  getApi().get('/api/accounts/getBalance', params, function (err, result) {
    console.log(err || result.balance)
  })
}

function getAccount (address) {
  var params = { address: address }
  getApi().get('/api/accounts/', params, function (err, result) {
    console.log(err || pretty(result.account))
  })
}

function getVotedDelegates (address, options) {
  var params = {
    address: address,
    limit: options.limit,
    offset: options.offset
  }
  getApi().get('/api/votes', params, function (err, result) {
    console.log(err || result)
  })
}

function getDelegates (options) {
  var params = {
    limit: options.limit,
    offset: options.offset,
    orderBy: options.sort || 'rate:asc'
  }
  getApi().get('/api/delegates/', params, function (err, result) {
    console.log(err || pretty(result.delegates))
  })
}

function getDelegatesCount () {
  getApi().get('/api/delegates/count', function (err, result) {
    console.log(err || result.count)
  })
}

function getVoters (publicKey) {
  var params = { publicKey: publicKey }
  getApi().get('/api/delegates/voters', params, function (err, result) {
    console.log(err || pretty(result.accounts))
  })
}

function getDelegateByPublicKey (publicKey) {
  var params = { publicKey: publicKey }
  getApi().get('/api/delegates/get', params, function (err, result) {
    console.log(err || pretty(result.delegate))
  })
}

function getDelegateByUsername (username) {
  var params = { username: username }
  getApi().get('/api/delegates/get', params, function (err, result) {
    console.log(err || pretty(result.delegate))
  })
}

function getBlocks (options) {
  var params = {
    limit: options.limit,
    orderBy: options.sort,
    offset: options.offset,
    totalAmount: options.totalAmount + '',
    totalFee: options.totalFee + '',
    reward: options.reward + '',
    generatorPublicKey: options.generatorPublicKey
  }
  getApi().get('/api/blocks/', params, function (err, result) {
    console.log(err || pretty(result))
  })
}

function getBlockById (id) {
  var params = { id: id }
  getApi().get('/api/blocks/get', params, function (err, result) {
    console.log(err || pretty(result.block))
  })
}

function getBlockByHeight (height) {
  var params = { height: height }
  getApi().get('/api/blocks/get', params, function (err, result) {
    console.log(err || pretty(result.block))
  })
}

function getPeers (options) {
  var params = {
    limit: options.limit,
    orderBy: options.sort,
    offset: options.offset,
    state: options.state,
    os: options.os,
    port: options.port,
    version: options.version
  }
  getApi().get('/api/peers/', params, function (err, result) {
    console.log(err || pretty(result.peers))
  })
}

function getUnconfirmedTransactions (options) {
  var params = {
    senderPublicKey: options.key,
    address: options.address
  }
  getApi().get('/api/transactions/unconfirmed', params, function (err, result) {
    console.log(err || pretty(result.transactions))
  })
}

function getTransactions (options) {
  var params = {
    blockId: options.blockId,
    limit: options.limit,
    orderBy: options.sort,
    offset: options.offset,
    type: options.type,
    senderPublicKey: options.senderPublicKey,
    senderId: options.senderId,
    recipientId: options.recipientId,
    amount: options.amount,
    fee: options.fee,
    message: options.message
  }
  getApi().get('/api/transactions/', params, function (err, result) {
    console.log(err || pretty(result.transactions))
  })
}

function getTransaction (id) {
  var params = { id: id }
  getApi().get('/api/transactions/get', params, function (err, result) {
    console.log(err || pretty(result.transaction))
  })
}

async function sendToken (options) {
  var trs = await NodeSdk.transaction.createTransaction(
    options.to,
    options.amount + '',
    options.message,
    options.secret,
    options.secondSecret
  )

  getApi().broadcastTransaction(trs, function (err, result) {
    console.log(err || result.transactionId)
  })
}

async function sendAsset (options) {
  var obj = {
    recipientId: options.to,
    currency: options.currency,
    aobAmount: options.amount + '',
    message: options.message
  }
  var trs = await NodeSdk.assetPlugin.createPluginAsset(65, obj, options.secret, options.secondSecret)

  getApi().broadcastTransaction(trs, function (err, result) {
    console.log(err || result.transactionId)
  })
}

async function registerDelegate (options) {
  var trs = await NodeSdk.delegate.createDelegate(options.username, options.secret, options.secondSecret)
  getApi().broadcastTransaction(trs, function (err, result) {
    console.log(err || result.transactionId)
  })
}

async function vote (secret, publicKeys, op, secondSecret) {
  if (!secret) {
    console.log('secret required.')
    return
  }

  if (!publicKeys) {
    console.log('publicKeys required.')
    return
  }

  var votes = publicKeys.split(',').map(function (el) {
    return op + el
  })
  var trs = await NodeSdk.vote.createVote(votes, secret, secondSecret)
  getApi().broadcastTransaction(trs, function (err, result) {
    console.log(err || result.transactionId)
  })
}

function listdiffvotes (options) {
  var params = { username: options.username }
  getApi().get('/api/delegates/get', params, function (err, result) {
    if (err) {
      console.log(err)
      return
    }

    var publicKey = result.delegate.publicKey
    var params = {
      address: result.delegate.address,
      limit: options.limit || 101,
      offset: options.offset || 0
    }
    getApi().get('/api/votes', params, function (err, result) {
      if (err) {
        console.log(err)
        return
      }

      var names_a = []
      for (var i = 0; i < result.delegates.length; ++i) {
        names_a[i] = result.delegates[i].username
      }
      var a = new Set(names_a)
      var params = { publicKey: publicKey }
      getApi().get('/api/delegates/voters', params, function (err, result) {
        if (err) {
          console.log(err)
          return
        }

        var names_b = []
        for (var i = 0; i < result.accounts.length; ++i) {
          names_b[i] = result.accounts[i].username
        }
        var b = new Set(names_b)
        var diffab = [...a].filter(x => {
          return x !== null && !b.has(x)
        })
        var diffba = [...b].filter(x => {
          return x !== null && !a.has(x)
        })

        console.log("you voted but doesn't vote you: \n\t", JSON.stringify(diffab))
        console.log("\nvoted you but you don't voted: \n\t", JSON.stringify(diffba))
      })
    })
  })
}

function upvote (options) {
  vote(options.secret, options.publicKeys, '+', options.secondSecret)
}

function downvote (options) {
  vote(options.secret, options.publicKeys, '-', options.secondSecret)
}

async function setSecondSecret (options) {
  var trs = await NodeSdk.signature.createSignature(options.secret, options.newSecondSecret)
  getApi().broadcastTransaction(trs, function (err, result) {
    console.log(err || result.transactionId)
  })
}

async function registerDapp (options) {
  if (!options.metafile || !fs.existsSync(options.metafile)) {
    console.error('Error: invalid params, dapp meta file must exists')
    return
  }

  if (!options.secret) {
    console.error('Error: invalid params, secret must exists')
    return
  }

  var dapp = JSON.parse(fs.readFileSync(options.metafile, 'utf8'))
  var trs = await NodeSdk.dapp.createDApp(dapp, options.secret, options.secondSecret)
  getApi().broadcastTransaction(trs, function (err, result) {
    console.log(err || result.transactionId)
  })
}

async function deposit (options) {
  const dapp = {
    dapp_id: options.dapp,
    currency: options.currency,
    amount: options.amount
  }
  const trs = await NodeSdk.assetPlugin.createPluginAsset(12, dapp, options.secret, options.secondSecret)
  //   var trs = NodeSdk.transfer.createInTransfer(options.dapp, options.currency, options.amount, options.secret, options.secondSecret)
  getApi().broadcastTransaction(trs, function (err, result) {
    console.log(err || result.transactionId)
  })
}

function dappTransaction (options) {
  var trs = NodeSdk.dapp.createInnerTransaction(
    {
      fee: options.fee,
      type: Number(options.type),
      args: options.args
    },
    options.secret
  )
  getApi().put('/api/dapps/' + options.dapp + '/transactions/signed', { transaction: trs }, function (err, result) {
    console.log(err || result.transactionId)
  })
}

async function lock (options) {
  var trs = await NodeSdk.transaction.createLock(options.height, options.secret, options.secondSecret)
  getApi().broadcastTransaction(trs, function (err, result) {
    console.log(err || result.transactionId)
  })
}

function getFullBlockById (id) {
  getApi().get('/api/blocks/full?id=' + id, function (err, result) {
    console.log(err || pretty(result.block))
  })
}

function getFullBlockByHeight (height) {
  getApi().get('/api/blocks/full?height=' + height, function (err, result) {
    console.log(err || pretty(result.block))
  })
}

async function getTransactionBytes (options) {
  try {
    var trs = JSON.parse(fs.readFileSync(options.file))
  } catch (e) {
    console.log('Invalid transaction format')
    return
  }

  const buff = await NodeSdk.crypto.getBytes(trs, true, true)
  const hex = buff.toString('hex')
  console.log(hex)
}

async function getTransactionId (options) {
  try {
    var trs = JSON.parse(fs.readFileSync(options.file))
  } catch (e) {
    console.log('Invalid transaction format')
    return
  }
  const trsId = await NodeSdk.crypto.getId(trs)
  console.log(trsId)
}

async function getBlockPayloadHash (options) {
  let block
  try {
    block = JSON.parse(fs.readFileSync(options.file))
  } catch (e) {
    console.log('Invalid transaction format')
    return
  }
  let payloadBytes = ''
  for (let i = 0; i < block.transactions.length; ++i) {
    payloadBytes += await NodeSdk.crypto.getBytes(block.transactions[i])
  }
  const payloadHash = DdnCrypto.createHash(Buffer.from(payloadBytes))

  console.log(payloadHash.toString('hex'))
}

function getBlockBytes (options) {
  let block
  try {
    block = JSON.parse(fs.readFileSync(options.file))
  } catch (e) {
    console.log('Invalid transaction format')
    return
  }
  console.log(blockHelper.getBytes(block, true).toString('hex'))
}

async function getBlockId (options) {
  let block
  try {
    block = JSON.parse(fs.readFileSync(options.file))
  } catch (e) {
    console.log('Invalid transaction format')
    return
  }
  const bytes = blockHelper.getBytes(block)
  console.log(await DdnCrypto.getId(bytes))
}

async function deployContract (options) {
  if (options.file && !fs.existsSync(options.file)) {
    console.error('Error: invalid params, contract file not exists')
    return
  }
  if (!options.file && !options.code) {
    console.error('Error: invalid params, contract code or file not exists')
    return
  }

  if (!options.secret) {
    console.error('Error: invalid params, secret must exists')
    return
  }

  const code = options.code || fs.readFileSync(options.file, 'utf8')
  const opts = { name: options.name, desc: options.desc, gasLimit: options.gas, version: options.ver, code }
  const trs = await NodeSdk.contract.deploy(opts, options.secret, options.secondSecret)
  console.log(trs)
  getApi().broadcastTransaction(trs, function (err, result) {
    console.log(err || result)
  })
}

async function sendContract (options) {
  if (!options.id) {
    console.error('Error: invalid params, contract id should provide')
    return
  }
  if (!options.method) {
    console.error('Error: invalid params, contract method should provide')
    return
  }

  if (!options.secret) {
    console.error('Error: invalid params, secret must exists')
    return
  }

  let args = options.args
  if (!args) args = options._.slice(2)
  if (typeof args === 'string') {
    try {
      args = JSON.parse(args)
    } catch (err) {
      console.error(`param args is malformed: '${args}', should be '["a", "b"]'`)
      console.error(err)
      return
    }
  }

  const opts = {
    id: options.id,
    gasLimit: options.gas,
    method: options.method,
    args
  }

  const trs = await NodeSdk.contract.send(opts, options.secret, options.secondSecret)
  console.log(trs)
  getApi().broadcastTransaction(trs, function (err, result) {
    console.log(err || result)
  })
}

async function payContract (options) {
  if (!options.id) {
    console.error('Error: invalid params, contract id should provide')
    return
  }
  if (!options.method) {
    console.error('Error: invalid params, contract method should provide')
    return
  }

  if (!options.secret) {
    console.error('Error: invalid params, secret must exists')
    return
  }

  let args = options.args
  if (!args) args = options._.slice(2)
  if (typeof args === 'string') {
    try {
      args = JSON.parse(args)
    } catch (err) {
      console.error(`param args is malformed: '${args}', should be '["a", "b"]'`)
      console.error(err)
      return
    }
  }

  const opts = {
    id: options.id,
    gasLimit: options.gas,
    amount: options.amount,
    currency: options.currency,
    method: options.method,
    args
  }
  const trs = await NodeSdk.contract.pay(opts, options.secret, options.secondSecret)
  console.log(trs)
  getApi().broadcastTransaction(trs, function (err, result) {
    console.log(err || result)
  })
}

async function callContract (options) {
  if (!options.id) {
    console.error('Error: invalid params, contract id should provide')
    return
  }

  let args = options.args
  if (!args) args = options._.slice(2)
  if (typeof args === 'string') {
    try {
      args = JSON.parse(args)
    } catch (err) {
      console.error(`param args is malformed: '${args}', should be '["a", "b"]'`)
      console.error(err)
      return
    }
  }
  const body = { id: options.id, method: options.method, args }
  console.log('query body: ', body)
  getApi().post('/api/contracts/call', body, function (err, res) {
    console.log(err || res.result)
  })
}

async function getContract (id) {
  if (!id) {
    console.error('Error: invalid params, contract id should provide')
    return
  }

  getApi().get('/api/contracts/get', { id }, function (err, res) {
    console.log(err || res)
  })
}

async function getContractCode (id) {
  if (!id) {
    console.error('Error: invalid params, contract id should provide')
    return
  }

  getApi().get('/api/contracts/code', { id }, function (err, res) {
    console.log(err || res)
  })
}

async function getContractMetadata (id) {
  if (!id) {
    console.error('Error: invalid params, contract id should provide')
    return
  }

  getApi().get('/api/contracts/metadata', { id }, function (err, res) {
    console.log(err || res)
  })
}

async function getContracts (options) {
  const { offset, limit, orderBy, blockId, tid, name, owner } = options
  getApi().get(
    '/api/contracts',
    {
      offset,
      limit,
      orderBy,
      blockId,
      tid,
      name,
      owner
    },
    function (err, res) {
      console.log(err || res)
    }
  )
}

async function getContractResults (options) {
  if (!options.id) {
    console.error('Error: invalid params, contract id should provide')
    return
  }

  getApi().get('/api/contracts/results', { id: options.id }, function (err, res) {
    console.log(err || res)
  })
}

async function getContractResult (options) {
  if (!options.id || !options.tid) {
    console.error('Error: invalid params, contract id and transaction id should provide')
    return
  }

  getApi().get('/api/contracts/results', options, function (err, res) {
    console.log(err || res)
  })
}

async function getContractStates (options) {
  if (!options.id || !options.path) {
    console.error('Error: invalid params, contract id and state path should provide')
    return
  }

  const params = { id: options.id, statePath: options.path }
  getApi().get('/api/contracts/states', params, function (err, res) {
    console.log(err || res.result)
  })
}

async function compileContract (options) {
  if (options.file && !fs.existsSync(options.file)) {
    console.error('Error: invalid params, contract file not exists')
    return
  }
  if (!options.file && !options.code) {
    console.error('Error: invalid params, contract code or file not exists')
    return
  }
  if (options.out && !fs.existsSync(options.out)) {
    try {
      fs.mkdirSync(options.out, { recursive: true })
    } catch (err) {
      console.error('Error: outpath created failed', err)
      return
    }
  }

  const code = options.code || fs.readFileSync(options.file, 'utf8')
  const out = options.out || '.'

  const compiler = new Compiler()
  const result = compiler.compile(code)

  if (!result || !result.compiledCode || !result.metadata) {
    throw new Error('failed compile contract')
  }
  const c = GasCounter.feeTable
  const gas = code.length * c.Contract.storePerChar + c.Contract.register

  fs.writeFileSync(path.resolve(out, 'contract.js'), result.compiledCode)
  fs.writeFileSync(path.resolve(out, 'metadata.json'), JSON.stringify(result.metadata, 4))

  console.log('compiled success!')
  console.log(`built file path: ${path.resolve(out)}`)
  console.log('compiled contract file: contract.js')
  console.log('contract metadata file: metadata.json')
  console.log(`deploy this contract need gas: ${gas}`)
}

function verifyBytes (options) {
  console.log(NodeSdk.crypto.verifyBytes(options.bytes, options.signature, options.publicKey))
}

export {
  init,
  getHeight,
  getBlockStatus,
  openAccount,
  openAccountByPublicKey,
  getBalance,
  getAccount,
  getVotedDelegates,
  getDelegatesCount,
  getDelegates,
  getVoters,
  getDelegateByPublicKey,
  getDelegateByUsername,
  getBlocks,
  getBlockById,
  getBlockByHeight,
  getPeers,
  getUnconfirmedTransactions,
  getTransactions,
  getTransaction,
  sendToken,
  sendAsset,
  registerDelegate,
  listdiffvotes,
  upvote,
  downvote,
  setSecondSecret,
  deposit,
  dappTransaction,
  lock,
  getFullBlockById,
  getFullBlockByHeight,
  getTransactionBytes,
  getTransactionId,
  getBlockBytes,
  getBlockPayloadHash,
  getBlockId,
  verifyBytes,
  registerDapp,
  deployContract,
  payContract,
  sendContract,
  callContract,
  getContract,
  getContracts,
  getContractCode,
  getContractMetadata,
  getContractResult,
  getContractResults,
  getContractStates,
  compileContract
}

//   program
//     .command('setSecondsecret')
//     .description('set second secret')
//     .option('-e, --secret <secret>', '')
//     .option('--newSecondSecret <secret>', '')
//     .option('--oldSecondSecret <secret>', '')
//     .action(setSecondSecret)

//   program
//     .command('deposit')
//     .description('deposit assets to an app')
//     .option('-e, --secret <secret>', '')
//     .option('-s, --secondSecret <secret>', '')
//     .option('-d, --dapp <dapp id>', 'dapp id that you want to deposit')
//     .option('-c, --currency <currency>', 'deposit currency')
//     .option('-a, --amount <amount>', 'deposit amount')
//     .action(deposit) -> depositDapp ?

//   program
//     .command('dappTransaction')
//     .description('create a dapp transaction')
//     .option('-e, --secret <secret>', '')
//     .option('-d, --dapp <dapp id>', 'dapp id')
//     .option('-t, --type <type>', 'transaction type')
//     .option('-a, --args <args>', 'json array format')
//     .option('-f, --fee <fee>', 'transaction fee')
//     .action(dappTransaction)
