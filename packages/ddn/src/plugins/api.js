import fs from 'fs'
import DdnCrypto from '@ddn/crypto'
import ddnJS from '@ddn/node-sdk'
import Api from '../helpers/api'
import blockHelper from '../helpers/block'

let globalOptions

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
  getApi().get('/api/accounts/delegates', params, function (err, result) {
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
  // var liskOptions = {host:'login.lisk.io', port:80};
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

async function sendMoney (options) {
  ddnJS.init.init(options.nethash)

  var trs = await ddnJS.transaction.createTransaction(
    options.to,
    // bignum update Number(options.amount),
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
  ddnJS.init.init(options.nethash)

  var obj = {
    recipientId: options.to,
    currency: options.currency,
    aobAmount: options.amount + '',
    message: options.message
  }
  var trs = await ddnJS.assetPlugin.createPluginAsset(65, obj, options.secret, options.secondSecret)

  getApi().broadcastTransaction(trs, function (err, result) {
    console.log(err || result.transactionId)
  })
}

async function registerDelegate (options) {
  ddnJS.init.init(options.nethash)

  var trs = await ddnJS.delegate.createDelegate(
    options.username,
    options.secret,
    options.secondSecret
  )
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
  var trs = await ddnJS.vote.createVote(
    votes,
    secret,
    secondSecret
  )
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
    getApi().get('/api/accounts/delegates', params, function (err, result) {
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

        console.log('you voted but doesn\'t vote you: \n\t', JSON.stringify(diffab))
        console.log('\nvoted you but you don\'t voted: \n\t', JSON.stringify(diffba))
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
  var trs = await ddnJS.signature.createSignature(options.secret, options.newSecondSecret, options.oldSecondSecret)
  getApi().broadcastTransaction(trs, function (err, result) {
    console.log(err || result.transactionId)
  })
}

async function registerDapp (options) {
  if (!options.metafile || !fs.existsSync(options.metafile)) {
    console.error('Error: invalid params, dapp meta file must exists')
    return
  }
  ddnJS.init.init(options.nethash)
  var dapp = JSON.parse(fs.readFileSync(options.metafile, 'utf8'))
  var trs = await ddnJS.assetPlugin.createPluginAsset(11, dapp, options.secret, options.secondSecret)
  //   var trs = ddnJS.dapp.createDApp(dapp, options.secret, options.secondSecret);
  getApi().broadcastTransaction(trs, function (err, result) {
    console.log(err || result.transactionId)
  })
}

async function deposit (options) {
  ddnJS.init.init(options.nethash)
  const dapp = {
    dapp_id: options.dapp,
    currency: options.currency,
    amount: options.amount
  }
  const trs = await ddnJS.assetPlugin.createPluginAsset(12, dapp, options.secret, options.secondSecret)
  //   var trs = ddnJS.transfer.createInTransfer(options.dapp, options.currency, options.amount, options.secret, options.secondSecret)
  getApi().broadcastTransaction(trs, function (err, result) {
    console.log(err || result.transactionId)
  })
}

function dappTransaction (options) {
  var trs = ddnJS.dapp.createInnerTransaction({
    fee: options.fee,
    type: Number(options.type),
    args: options.args
  }, options.secret)
  getApi().put('/api/dapps/' + options.dapp + '/transactions/signed', { transaction: trs }, function (err, result) {
    console.log(err || result.transactionId)
  })
}

async function lock (options) {
  ddnJS.init.init(options.nethash)
  var trs = await ddnJS.transaction.createLock(options.height, options.secret, options.secondSecret)
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
  ddnJS.init.init(options.nethash)
  try {
    var trs = JSON.parse(fs.readFileSync(options.file))
  } catch (e) {
    console.log('Invalid transaction format')
    return
  }

  const buff = await ddnJS.crypto.getBytes(trs, true, true)
  const hex = buff.toString('hex')
  console.log(hex)
}

async function getTransactionId (options) {
  ddnJS.init.init(options.nethash)
  try {
    var trs = JSON.parse(fs.readFileSync(options.file))
  } catch (e) {
    console.log('Invalid transaction format')
    return
  }
  const trsId = await ddnJS.crypto.getId(trs)
  console.log(trsId)
}

async function getBlockPayloadHash (options) {
  ddnJS.init.init(options.nethash)
  let block
  try {
    block = JSON.parse(fs.readFileSync(options.file))
  } catch (e) {
    console.log('Invalid transaction format')
    return
  }
  let payloadBytes = ''
  for (let i = 0; i < block.transactions.length; ++i) {
    payloadBytes += await ddnJS.crypto.getBytes(block.transactions[i])
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

function verifyBytes (options) {
  console.log(ddnJS.crypto.verifyBytes(options.bytes, options.signature, options.publicKey))
}

export default function (program) {
  globalOptions = program

  program
    .command('getHeight')
    .description('get block height')
    .action(getHeight)

  program
    .command('getBlockstatus')
    .description('get block status')
    .action(getBlockStatus)

  program
    .command('openAccount [secret]')
    .description('open your account and get the infomation by secret')
    .action(openAccount)

  program
    .command('openAccountByPublickey [publickey]')
    .description('open your account and get the infomation by publickey')
    .action(openAccountByPublicKey)

  program
    .command('getBalance [address]')
    .description('get balance by address')
    .action(getBalance)

  program
    .command('getAccount [address]')
    .description('get account by address')
    .action(getAccount)

  program
    .command('getVotedDelegates [address]')
    .description('get delegates voted by address')
    .option('-o, --offset <n>', '')
    .option('-l, --limit <n>', '')
    .action(getVotedDelegates)

  program
    .command('getDelegatesCount')
    .description('get delegates count')
    .action(getDelegatesCount)

  program
    .command('getDelegates')
    .description('get delegates')
    .option('-o, --offset <n>', '')
    .option('-l, --limit <n>', '')
    .option('-s, --sort <field:mode>', 'rate:asc, vote:desc, ...')
    .action(getDelegates)

  program
    .command('getVoters [publicKey]')
    .description('get voters of a delegate by public key')
    .action(getVoters)

  program
    .command('getDelegateByPublickey [publicKey]')
    .description('get delegate by public key')
    .action(getDelegateByPublicKey)

  program
    .command('getDelegateByUsername [username]')
    .description('get delegate by username')
    .action(getDelegateByUsername)

  program
    .command('getBlocks')
    .description('get blocks')
    .option('-o, --offset <n>', '')
    .option('-l, --limit <n>', '')
    .option('-r, --reward <n>', '')
    .option('-f, --totalFee <n>', '')
    .option('-a, --totalAmount <n>', '')
    .option('-g, --generatorPublicKey <publicKey>', '')
    .option('-s, --sort <field:mode>', 'height:asc, totalAmount:asc, totalFee:asc')
    .action(getBlocks)

  program
    .command('getBlockById [id]')
    .description('get block by id')
    .action(getBlockById)

  program
    .command('getBlockByHeight [height]')
    .description('get block by height')
    .action(getBlockByHeight)

  program
    .command('getPeers')
    .description('get peers')
    .option('-o, --offset <n>', '')
    .option('-l, --limit <n>', '')
    .option('-t, --state <n>', ' 0 ~ 3')
    .option('-s, --sort <field:mode>', '')
    .option('-v, --version <version>', '')
    .option('-p, --port <n>', '')
    .option('--os <os>', '')
    .action(getPeers)

  program
    .command('getUnconfirmedTransactions')
    .description('get unconfirmed transactions')
    .option('-k, --key <sender public key>', '')
    .option('-a, --address <address>', '')
    .action(getUnconfirmedTransactions)

  program
    .command('getTransactions')
    .description('get transactions')
    .option('-b, --blockId <id>', '')
    .option('-o, --offset <n>', '')
    .option('-l, --limit <n>', '')
    .option('-t, --type <n>', 'transaction type')
    .option('-s, --sort <field:mode>', '')
    .option('-a, --amount <n>', '')
    .option('-f, --fee <n>', '')
    .option('-m, --message <message>', '')
    .option('--senderPublicKey <key>', '')
    .option('--senderId <id>', '')
    .option('--recipientId <id>', '')
    .action(getTransactions)

  program
    .command('getTransaction [id]')
    .description('get transactions')
    .action(getTransaction)

  program
    .command('sendToken')
    .description('send token to some address')
    .option('-e, --secret <secret>', '')
    .option('-s, --secondSecret <secret>', '')
    .option('-a, --amount <n>', '')
    .option('-t, --to <address>', '')
    .option('-m, --message <message>', '')
    .option('-n, --nethash <nethash>', 'fl6ybowg')
    .action(sendMoney)

  program
    .command('sendAsset')
    .description('send asset to some address')
    .option('-e, --secret <secret>', '')
    .option('-s, --secondSecret <secret>', '')
    .option('-c, --currency <currency>', '')
    .option('-a, --amount <amount>', '')
    .option('-t, --to <address>', '')
    .option('-m, --message <message>', '')
    .action(sendAsset)

  program
    .command('registerDelegate')
    .description('register delegate')
    .option('-e, --secret <secret>', '')
    .option('-s, --secondSecret <secret>', '')
    .option('-u, --username <username>', '')
    .action(registerDelegate)

  program
    .command('listDiffVotes')
    .description('list the votes each other')
    .option('-u, --username <username>', '', process.env.DDN_USER)
    .action(listdiffvotes)

  program
    .command('upVote')
    .description('vote for delegates')
    .option('-e, --secret <secret>', '')
    .option('-s, --secondSecret <secret>', '')
    .option('-p, --publicKeys <public key list>', '')
    .action(upvote)

  program
    .command('downVote')
    .description('cancel vote for delegates')
    .option('-e, --secret <secret>', '')
    .option('-s, --secondSecret <secret>', '')
    .option('-p, --publicKeys <public key list>', '')
    .action(downvote)

  program
    .command('setSecondsecret')
    .description('set second secret')
    .option('-e, --secret <secret>', '')
    .option('--newSecondSecret <secret>', '')
    .option('--oldSecondSecret <secret>', '')
    .action(setSecondSecret)

  program
    .command('registerDapp')
    .description('register a dapp')
    .option('-e, --secret <secret>', '')
    .option('-s, --secondSecret <secret>', '')
    .option('-f, --metafile <metafile>', 'dapp meta file')
    .action(registerDapp)

  program
    .command('deposit')
    .description('deposit assets to an app')
    .option('-e, --secret <secret>', '')
    .option('-s, --secondSecret <secret>', '')
    .option('-d, --dapp <dapp id>', 'dapp id that you want to deposit')
    .option('-c, --currency <currency>', 'deposit currency')
    .option('-a, --amount <amount>', 'deposit amount')
    .action(deposit)

  program
    .command('dappTransaction')
    .description('create a dapp transaction')
    .option('-e, --secret <secret>', '')
    .option('-d, --dapp <dapp id>', 'dapp id')
    .option('-t, --type <type>', 'transaction type')
    .option('-a, --args <args>', 'json array format')
    .option('-f, --fee <fee>', 'transaction fee')
    .action(dappTransaction)

  program
    .command('lock')
    .description('lock account transfer')
    .option('-e, --secret <secret>', '')
    .option('-s, --secondSecret <secret>', '')
    .option('-h, --height <height>', 'lock height')
    .action(lock)

  program
    .command('getFullBlockById [id]')
    .description('get full block by block id')
    .action(getFullBlockById)

  program
    .command('getFullBlockByHeight [height]')
    .description('get full block by block height')
    .action(getFullBlockByHeight)

  program
    .command('getTransactionBytes')
    .description('get transaction bytes')
    .option('-f, --file <file>', 'transaction file')
    .action(getTransactionBytes)

  program
    .command('getTransactionId')
    .description('get transaction id')
    .option('-f, --file <file>', 'transaction file')
    .action(getTransactionId)

  program
    .command('getBlockBytes')
    .description('get block bytes')
    .option('-f, --file <file>', 'block file')
    .action(getBlockBytes)

  program
    .command('getBlockPayloadHash')
    .description('get block bytes')
    .option('-f, --file <file>', 'block file')
    .action(getBlockPayloadHash)

  program
    .command('getBlockId')
    .description('get block id')
    .option('-f, --file <file>', 'block file')
    .action(getBlockId) // todo: async

  program
    .command('verifyBytes')
    .description('verify bytes/signature/publickey')
    .option('-b, --bytes <bytes>', 'transaction or block bytes')
    .option('-s, --signature <signature>', 'transaction or block signature')
    .option('-p, --publicKey <publicKey>', 'signer public key')
    .action(verifyBytes)
}
