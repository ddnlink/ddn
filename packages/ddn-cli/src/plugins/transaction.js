import fs from 'fs'
import path from 'path'
import JsSdk from '@ddn/js-sdk'
import Api from '../utils/api'

let globalOptions

// 调用其他方法之前需要初始化全局选项
function init (options) {
  globalOptions = options
}

function getApi () {
  return new Api({ host: globalOptions.host, port: globalOptions.port, mainnet: !!globalOptions.main })
}

function getUnconfirmedTransactions (options) {
    const params = {
      senderPublicKey: options.key,
      address: options.address
    }
    getApi().get('/api/transactions/unconfirmed', params, function (err, result) {
      console.log(err || pretty(result.transactions))
    })
  }

  function getTransactions (options) {
    const params = {
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
    const params = { id: id }
    getApi().get('/api/transactions/get', params, function (err, result) {
      console.log(err || pretty(result.transaction))
    })
  }

  async function sendToken (options) {
    // 初始化 JsSdk
    JsSdk.init()
    const trs = await JsSdk.transaction.createTransaction(
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

  // 批量转账, 从文件中读取地址和金额, 每行一个地址和金额, 用逗号分隔,e.g:  DJAoaGnmMmgoqeAgBHnxFCdBhThmtTb7fk, 500
  async function sendTokens (options) {
    const accountsFile = path.resolve(options.file)
    if (accountsFile && fs.existsSync(accountsFile)) {
        const lines = fs.readFileSync(accountsFile, 'utf8').split('\n')
        for (const i in lines) {
          const parts = lines[i].split(', ')

          if (parts.length !== 2) {
            console.error(`Invalid recipient balance format ${lines[i]}`)
            break
          }

        // 初始化 JsSdk
        JsSdk.init()
        const trs = await JsSdk.transaction.createTransaction(
            parts[0],
            parts[1] + '',
            '',
            options.secret,
            options.secondSecret
          )

          console.log(`Sending ${parts[1]} DDN to ${parts[0]}， trs: `, JSON.stringify(trs.nethash))

          getApi().broadcastTransaction(trs, function (err, result) {
            console.log(err || result.transactionId)
          })
        }
      }
  }

  async function sendAsset (options) {
    const obj = {
      recipientId: options.to,
      currency: options.currency,
      aobAmount: options.amount + '',
      message: options.message
    }
    // 初始化 JsSdk
    JsSdk.init()
    const trs = await JsSdk.assetPlugin.createPluginAsset(65, obj, options.secret, options.secondSecret)

    getApi().broadcastTransaction(trs, function (err, result) {
      console.log(err || result.transactionId)
    })
  }

  export {
    getApi,
    init,
    getUnconfirmedTransactions,
    getTransactions,
    getTransaction,
    sendToken,
    sendTokens,
    sendAsset,
  }