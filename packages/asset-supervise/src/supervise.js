import ByteBuffer from 'bytebuffer'
import Asset from '@ddn/asset-base'
import DdnUtils, { checkWord, reportWord } from '@ddn/utils'
const DdnJS = require('@ddn/node-sdk').default
const crypto = require('crypto')
const request = require('request-promise')
const key = 'lWfSp3x4QfMZLIvtt1LP5CrzArnxKCMNjCdjwFw9upInWxTKlXvE1PIfpObTpSZllyVz7ZmxSkFKOadYoqKYJw=='
const secret = DdnJS.crypto.generateSecret()
const look = Symbol('look')
const lookTts = Symbol('lookTts')
class Supervise extends Asset.Base {
  // eslint-disable-next-line no-useless-constructor
  constructor (context, transactionConfig) {
    super(context, transactionConfig)
    this.customApi = '/v1/sys' // 自定义路由前缀，默认为api/${assetName}
    this.oneoff = new Map() // 覆盖全局的oneff
  }

  async calculateFee () {
    return 0
  }

  async propsMapping () {
    return [
      { field: 'str4', prop: 'txHash', required: true, maxLen: 128 },
      { field: 'str1', prop: 'op', required: true, maxLen: 32 }
      // { field: 'str4', prop: 'senderId', required: true, maxLen: 128 },
    ]
  }

  async attachApi (router) {
    /**
    * @description 心跳接口
    * @param {*} body {taskId:string,checkpoint:number}
    */
    router.post('/heartbeat', async (req, res) => {
      const body = req.body
      const headers = req.headers
      const originalUrl = req.originalUrl
      this.logger.info('start heartbeat')
      const n = 10
      const validateErrors = await this.ddnSchema.validate(
        {
          type: 'object',
          properties: {
            taskId: {
              type: 'string'
            },
            checkpoint: {
              type: 'number'
            }
          },
          required: ['taskId', 'checkpoint']
        },
        body
      )
      if (validateErrors) {
        this.logger.error(`Invalid parameters: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`)
        res.json({
          success: false,
          message: `Invalid parameters: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`
        })
        return
      }
      if (!headers.authorization_v2) {
        this.logger.error('Authorization header is required')
        res.json({
          success: false,
          message: 'Authorization header is required'
        })
        return
      }
      this.logger.debug('headers.Authorization_v2', headers.authorization_v2)
      const verify = await verifyAuth({ body, url: originalUrl, authorization: headers.authorization_v2 })
      if (!verify.success) {
        this.logger.error(`Authorization fail authorization:${headers.authorization_v2}`)
        res.json(verify)
        return
      }
      let blocksData = await this.runtime.dataquery.queryFullBlockData({ height: { $gte: body.checkpoint, $lt: body.checkpoint + n } }, null, null, [
        ['height', 'asc']
      ])
      blocksData = await this.runtime.block._parseObjectFromFullBlocksData(blocksData)
      // this.logger.info(`block data limit 10 ${JSON.stringify(blocksData)}`)
      blocksData = formatBlockData(blocksData)
      res.json({
        success: true,
        message: 'ok',
        data: {
          taskId: body.taskId,
          checkpoint: body.checkpoint + n,
          blocks: [...blocksData]
        }
      })
    })
    /**
  * @description 下发巡检
  * @param {*} {taskId:string}
  */
    router.post('/inspection', async ({ body, headers, originalUrl }, res) => {
      this.logger.info('start postInspection')
      console.log('start postInspection')
      const validateErrors = await this.ddnSchema.validate(
        {
          type: 'object',
          properties: {
            taskId: {
              type: 'string'
            }
          },
          required: ['taskId']
        },
        body
      )
      if (validateErrors) {
        this.logger.error(`Invalid parameters: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`)
        res.json({
          success: false,
          error: `Invalid parameters: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`
        })
        return
      }
      if (!headers.authorization_v2) {
        this.logger.error('Authorization header is required')
        res.json({
          success: false,
          message: 'Authorization header is required'
        })
        return
      }
      const verify = await verifyAuth({ body, url: originalUrl, authorization: headers.authorization_v2 })
      if (!verify.success) {
        this.logger.error(`Authorization fail authorization:${headers.authorization_v2}`)
        res.json(verify)
        return
      }
      // 查看巡检任务，如果完成后再次下发巡检，删除上次记录
      if (this.oneoff.get('inspection')) { // true 正在巡检false已完成巡检
        this.logger.error('the Inspection is runing')
        res.json({
          success: false,
          message: 'the Inspection is runing'
        })
        return
      } else {
        this.oneoff.clear()
      }
      const count = await this.runtime.block.getCount()
      this.oneoff.set(body.taskId, { status: 'processing', height: count, offset: 0 })
      this.oneoff.set('inspection', true)
      const limit = 50; const offset = 0
      try {
        await this[look]({ taskId: body.taskId, limit, offset })
      } catch (error) {
        this.logger.error('post inspection fail error：', error)
        this.oneoff.set(body.taskId, { status: 'failure', height: count, offset: 0 })
      }
      res.json({
        success: true,
        message: 'ok'
      })
    })
    /**
   * @description 下发管控
   * @param {*} {txHash:string,op:string}
   */
    router.post('/cmd', async ({ body, headers, originalUrl }, res) => {
      const validateErrors = await this.ddnSchema.validate(
        {
          type: 'object',
          properties: {
            txHash: {
              type: 'string'
            },
            op: {
              type: 'string'
            }
          },
          required: ['txHash', 'op']
        },
        body
      )
      if (validateErrors) {
        this.logger.error(`Invalid parameters: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`)
        res.json({
          success: false,
          message: `Invalid parameters: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`
        })
        return
      }
      if (!headers.authorization_v2) {
        this.logger.error('Authorization header is required')

        res.json({
          success: false,
          message: 'Authorization header is required'
        })
        return
      }
      const verify = await verifyAuth({ body, url: originalUrl, authorization: headers.authorization_v2 })
      if (!verify.success) {
        this.logger.error(`Authorization fail authorization:${headers.authorization_v2}`)

        res.json(verify)
        return
      }
      const example = {
        txHash: body.txHash,
        op: body.op
      }
      let transaction = await DdnJS.supervise.createSupervise(example, secret)
      transaction = JSON.parse(JSON.stringify({ transaction }))
      const data = await request({
        method: 'POST',
        uri: `http://${headers.host}/peer/transactions`,
        body: transaction,
        headers: {
          nethash: this.constants.nethash,
          version: this.constants.version || 0
        },
        json: true // Automatically stringifies the body to JSON
      })
      if (data.success) {
        res.json({
          success: true,
          message: 'ok',
          data: {
            reviewType: 'api',
            reviewUrl: `http://${headers.host}/api/transactions/get?id=${body.txHash}`
          }
        })
      } else {
        this.logger.error(`createSupervise error data:${JSON.stringify(data)}`)
        res.json({
          success: false,
          message: data.error
        })
      }
    })
    /**
  * @description 获取巡检状态
  * @param {*} {txHash:string,op:string}
  */
    router.get('/inspection/:taskid', async ({ query, params, headers, originalUrl }, res) => {
      if (!query) {
        query = ''
      }
      if (!headers.authorization_v2) {
        res.json({
          success: false,
          message: 'Authorization header is required'
        })
        return
      }
      const verify = await verifyAuth({ body: '', url: originalUrl, authorization: headers.authorization_v2 })
      if (!verify.success) {
        this.logger.error(`Authorization fail authorization:${headers.authorization_v2}`)
        res.json(verify)
        return
      }
      const status = this.oneoff.get(params.taskid)
      if (!status) {
        res.json({
          success: false,
          message: 'the taskId is not exist!'
        })
        return
      }
      res.json({
        success: true,
        message: 'ok',
        data: status
      })
    })
    /**
   * @description 取消巡检
   * @param {*} {txHash:string,op:string}
   */
    router.delete('/inspection/:taskid', async ({ query, params, headers, originalUrl }, res) => {
      if (!query) {
        query = ''
      }
      if (!headers.authorization_v2) {
        res.json({
          success: false,
          message: 'Authorization header is required'
        })
        return
      }
      const verify = await verifyAuth({ body: '', url: originalUrl, authorization: headers.authorization_v2 })
      if (!verify.success) {
        this.logger.error(`Authorization fail authorization:${headers.authorization_v2}`)
        res.json(verify)
        return
      }
      const status = this.oneoff.get(params.taskid)
      if (!status) {
        res.json({
          success: true,
          message: 'ok'
        })
        return
      }
      switch (status.status) {
        case 'complete':
          res.json({
            success: false,
            message: 'the inspection is completed'
          })
          return
        case 'none':
          res.json({
            success: false,
            message: 'the inspection is cancled'
          })
          return
        case 'failure':
          res.json({
            success: false,
            message: 'the inspection is failure'
          })
          return
        default:
          break
      }
      this.oneoff.set('inspection', false)
      this.oneoff.set(params.taskid, { status: 'none', height: status.height, offset: status.offset })
      res.json({
        success: true,
        message: 'ok'
      })
    })
  }

  // 使用symbol模拟私有方法，以防把方法挂在到路由上,循环遍历交易，每次一百条然后上报
  async [look] ({ taskId, limit = 100, offset }) {
    const status = this.oneoff.get(taskId)
    const data = await this[lookTts]({ where: { block_height: { $lte: status.height } }, limit, offset, orders: null, returnTotal: true })
    const formatTrs = []
    data.rows.map(item => {
      if (item.message) {
        const temp = {
          txHash: item.id,
          content: item.message
        }
        formatTrs.push(temp)
      }
    })
    if (formatTrs.length <= 0) {
      if (data.rows.length >= limit) {
        // console.log("没有交易，继续巡检", this.oneoff.get("inspection"),'height',data.rows[data.rows.length - 1].block_height)
        const status = this.oneoff.get(taskId)
        this.oneoff.set(taskId, { status: status.status, height: status.height, offset: data.rows[data.rows.length - 1].block_height })
        if (data.rows.length >= limit && this.oneoff.get('inspection')) {
          this[look]({ taskId, limit, offset: offset + limit })
        }
        return
      } else {
        const status = this.oneoff.get(taskId)
        this.oneoff.set('inspection', false)
        this.oneoff.set(taskId, { status: 'complete', height: status.height, offset: status.height })
        return
      }
    }
    // console.log('this.constants.net.superviseBaseUrl',this.constants.net.superviseBaseUrl)
    const result = await checkWord(this, formatTrs, this.constants.net.superviseBaseUrl)
    // 敏感词检查出错，直接上报出错原因继续向下检查
    if (result.code !== 0) {
      this.logger.error(`checkWord error data: ${JSON.stringify(result)}`, result)
      await reportWord({ trs: null, message: result.message, status: data.rows.length < limit, success: false, taskId, that: this, baseUrl: this.constants.net.superviseBaseUrl })
      // 未完成巡检
      if (data.rows.length >= limit && this.oneoff.get('inspection')) {
        const status = this.oneoff.get(taskId)
        this.oneoff.set(taskId, { status: status.status, height: status.height, offset: data.rows[data.rows.length - 1].block_height })
        this[look]({ taskId, limit, offset: offset + limit })
        // 完成巡检
      } else {
        this.oneoff.set('inspection', false)
        const status = this.oneoff.get(taskId)
        const offset = data.rows.length >= limit ? data.rows[data.rows.length - 1].block_height : status.height
        this.oneoff.set(taskId, { status: status.status === 'none' ? status.status : 'complete', height: status.height, offset })
      }
      return
    }
    const reportData = await formatReportData({ oldTrs: data.rows, hitsTrs: result.errTrs })
    await reportWord({ trs: reportData, message: result.message, status: data.rows.length < limit, success: true, taskId, that: this, baseUrl: this.constants.net.superviseBaseUrl })
    if (data.rows.length >= limit && this.oneoff.get('inspection')) {
      this[look]({ taskId, limit, offset: offset + limit })
      const status = this.oneoff.get(taskId)
      const offestData = data.rows.length >= limit ? data.rows[data.rows.length - 1].block_height : status.height
      this.oneoff.set(taskId, { status: status.status, height: status.height, offset: offestData })
    } else {
      this.oneoff.set('inspection', false)
      const status = this.oneoff.get(taskId)
      const offestData = data.rows.length >= limit ? data.rows[data.rows.length - 1].block_height : status.height
      this.oneoff.set(taskId, { status: status.status === 'none' ? status.status : 'complete', height: status.height, offset: offestData })
    }
  }

  // 查询交易信息bu包含资产信息
  async [lookTts] ({ where, limit, offset, orders, returnTotal }) {
    // await sleep(5000)
    return new Promise((resolve, reject) => {
      this.dao.findPage(
        'tr',
        where,
        limit,
        offset,
        returnTotal || false,
        null,
        orders,
        (err, rows) => {
          if (err) {
            this.logger.error('Query transactions from database error', err)
            reject(err)
          } else {
            resolve(rows)
          }
        }
      )
      // }
      // )
    })
  }

  async getBytes (trs) {
    const asset = await this.getAssetObject(trs)
    const bb = new ByteBuffer(1, true)
    bb.writeString(asset.txHash)
    bb.writeString(asset.op)
    // bb.writeString(asset.senderId)
    bb.flip()
    return bb.toBuffer()
  }

  async verify (trs, sender) {
    const trans = await super.verify(trs, sender)
    const assetObj = await this.getAssetObject(trs)
    if (DdnUtils.bignum.isGreaterThanOrEqualTo(sender.balance, '900000000000000000')) {
      let result
      try {
        await this.findOneSupervise(assetObj)
      } catch (error) {
        console.log('errr', error)
      }
      if (result) {
        throw new Error('the supervise is exist!')
      }
    }
    return trans
  }

  async applyUnconfirmed (trs, sender, dbTrans) {
    const assetObj = await this.getAssetObject(trs)
    const key = `${sender.address}:${trs.type}:${assetObj.txHash}:${assetObj.op}`
    if (this.oneoff.has(key)) {
      throw new Error(`The Supervise ${assetObj.txHash} is in process already.`)
    }
    await super.applyUnconfirmed(trs, sender, dbTrans)
    this.oneoff.set(key, true)
  }

  async undoUnconfirmed (trs, sender, dbTrans) {
    const assetObj = await this.getAssetObject(trs)
    const key = `${sender.address}:${trs.type}:${assetObj.txHash}:${assetObj.op}`
    this.oneoff.delete(key)
    const result = await super.undoUnconfirmed(trs, sender, dbTrans)
    return result
  }

  async undo (trs, sender, dbTrans) {
    await this.destroySupervise(trs.id, dbTrans)
    const result = await super.undoUnconfirmed(trs, sender, dbTrans)
    return result
  }

  async dbSave (trs, dbTrans) {
    const superviseObj = await this.getAssetObject(trs)
    superviseObj.senderId = trs.senderId
    superviseObj.transaction_id = trs.id
    await this.saveSupervise(superviseObj, dbTrans)
    await super.dbSave(trs, dbTrans)
  }

  async saveSupervise (superviseObj, dbTrans) {
    const data = await this.findOneSupervise({ txHash: superviseObj.txHash }, dbTrans)
    if (data) {
      return this.updateSupervise({ op: superviseObj.op }, { txHash: superviseObj.txHash }, dbTrans)
    } else {
      return new Promise((resolve, reject) => {
        this._context.dao.insertOrUpdate('supervise', superviseObj, dbTrans, (err, result) => {
          if (err) {
            return reject(new Error(`insertOrUpdate supervise ${err}`))
          }

          resolve(result)
        })
      })
    }
  }

  async findOneSupervise (superviseObj, dbTrans) {
    return new Promise((resolve, reject) => {
      this.dao.findOne('supervise', {
        ...superviseObj
      }, null, dbTrans, (err, rows) => {
        if (err) {
          reject(err)
        } else {
          resolve(rows)
        }
      })
    })
  }

  async destroySupervise (transaction_id, dbTrans) {
    return new Promise((resolve, reject) => {
      this.dao.remove('supervise', {
        transaction_id
      }, null, dbTrans, (err, rows) => {
        if (err) {
          reject(err)
        } else {
          resolve(rows)
        }
      })
    })
  }

  async updateSupervise (superviseObj, where, dbTrans) {
    return new Promise((resolve, reject) => {
      this.dao.update('supervise', superviseObj, where, dbTrans, (err, rows) => {
        if (err) {
          reject(err)
        } else {
          resolve(rows)
        }
      })
    })
  }
}

// 把命中的交易信息格式化成上报的交易格式
async function formatReportData ({ oldTrs, hitsTrs }) {
  const newData = []
  oldTrs.map(oldTr => {
    hitsTrs.map(hitTrId => {
      if (oldTr.id === hitTrId) {
        const temp = {
          txHash: hitTrId,
          fromAcct: oldTr.senderId || '0x0',
          toAcct: oldTr.recipientId || '0x0',
          content: oldTr.message || '',
          type: 'normal',
          createdAt: DdnJS.utils.slots.getRealTime(oldTr.timestamp) / 1000

        }
        newData.push(temp)
      }
    })
  })
  return newData
}
// 加密
async function getHmacSHA512 ({ request, key }) {
  const hmac = crypto.createHmac('sha512', key)
  const data = hmac.update(request)
  return data.digest('hex')
}
// 获取Authorization
// async function getAuth ({ body, url }) {
//   const data = await encryption({ body, url })
//   const timestamp = Date.parse(new Date()) / 1000
//   return 'JG-' + data + '-' + timestamp
// }
async function encryption ({ body, url, timestamp, nonce }) {
  let request = [url, timestamp, nonce]
  if (body) {
    request.push(JSON.stringify(body))
  }
  request = request.sort()

  let str = ''
  for (let index = 0; index < request.length; index++) {
    str += request[index]
  }
  const data = await getHmacSHA512({ request: str, key: key })
  return data
}
async function verifyAuth ({ url, body, authorization }) {
  const reqAuthorization = authorization.split('-')
  if (body) {
    body = sort(body)
  }
  const data = await encryption({ body, url, timestamp: reqAuthorization[2], nonce: reqAuthorization[3] })
  if (reqAuthorization[1] === data) {
    return { success: true, message: 'verify authorization ok' }
  } else {
    return { success: false, message: 'verify authorization fail' }
  }
}
// 格式化心跳任务的块数据
function formatBlockData (blocks) {
  blocks = blocks.map(item => {
    const temp = {}
    temp.height = item.height
    temp.hash = item.payload_hash
    temp.parentHash = item.previous_block
    temp.createdAt = item.timestamp
    temp.txs = []
    temp.txs.push
    if (item.transactions.length !== 0) {
      temp.txs = item.transactions.map(transaction => {
        const ttemp = {}
        ttemp.hash = transaction.signature
        ttemp.fromAcct = transaction.senderId || '0x0'
        ttemp.toAcct = transaction.t_recipientId || '0x0'
        return ttemp
      })
    }
    return temp
  })
  return blocks
}
function sort (jsonObj) {
  const arr = []
  const newObj = {}
  for (var key in jsonObj) {
    arr.push(key)
  }
  arr.sort()
  for (var i in arr) {
    newObj[arr[i]] = jsonObj[arr[i]]
  }
  return newObj
}
// async function sleep (time) {
//   return new Promise((resolve, reject) => {
//     setTimeout(() => {
//       resolve()
//     }, time)
//   })
// }
export default Supervise
