import { Buffer } from 'buffer'
const DdnJS = require('@ddn/node-sdk').default
const crypto = require('crypto')
const request = require('request-promise')

const baseUrl = 'http://localhost:3000' // 监管的host
const key = ''
var secret = 'enter boring shaft rent essence foil trick vibrant fabric quote indoor output'
const look = Symbol('look')
const lookTts = Symbol('lookTts')

/**
 * Supervise 下发管控 接口
 * wly   2020-10-21
 * 描述：请求接口需要key
 */

class Supervise {
  constructor (context) {
    Object.assign(this, context)
    this._context = context
    this.oneoff = new Map() // 覆盖全局的oneff
  }

  /**
 * @description 心跳接口
 * @param {*} body {taskId:string,checkpoint:number}
 */
  async postHeartbeat ({ body, headers, originalUrl }) {
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
      return {
        success: false,
        message: `Invalid parameters: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`
      }
    }
    if (!headers.authorization) {
      return {
        success: false,
        message: 'Authorization header is required'
      }
    }
    const verify = await verifyAuth({ body, url: originalUrl, authorization: headers.authorization })
    if (!verify) {
      return {
        success: false,
        message: 'Authorization fail'
      }
    }
    let blocksData = await this.runtime.dataquery.queryFullBlockData({ height: { $gte: body.checkpoint, $lte: body.checkpoint + n } }, null, null, [
      ['height', 'asc']
    ])
    blocksData = await this.runtime.block._parseObjectFromFullBlocksData(blocksData)
    console.log('blockDAta', blocksData)
    blocksData = formatBlockData(blocksData)
    return {
      success: true,
      message: 'ok',
      data: {
        taskId: '0x123456acb',
        checkpoint: body.checkpoint + n,
        blocks: [...blocksData]
      }
    }
  }

  /**
 * @description 下发巡检
 * @param {*} {taskId:string}
 */
  async postInspection ({ body, headers, originalUrl }) {
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
      return {
        success: false,
        error: `Invalid parameters: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`
      }
    }
    if (!headers.authorization) {
      return {
        success: false,
        message: 'Authorization header is required'
      }
    }
    const verify = await verifyAuth({ body, url: originalUrl, authorization: headers.authorization })
    if (!verify) {
      return {
        success: false,
        message: 'Authorization fail'
      }
    }
    // 查看巡检任务，如果完成后再次下发巡检，删除上次记录
    if (this.oneoff.get('inspection')) { // true 正在巡检false已完成巡检
      return {
        success: false,
        message: 'the Inspection is runing'
      }
    } else {
      this.oneoff.clear()
    }
    const count = await await this.runtime.block.getCount()
    this.oneoff.set(body.taskId, { status: 'running', height: count, offset: 0 })
    this.oneoff.set('inspection', true)
    const limit = 100; const offset = 0
    this[look]({ taskId: body.taskId, limit, offset })
    return {
      success: true,
      message: 'ok'
    }
  }

  /**
   * @description 下发管控
   * @param {*} {txHash:string,op:string}
   */
  async postCmd ({ body, headers, originalUrl }) {
    console.log(body, headers, originalUrl)
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
      return {
        success: false,
        message: `Invalid parameters: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`
      }
    }
    if (!headers.authorization) {
      return {
        success: false,
        message: 'Authorization header is required'
      }
    }
    const verify = await verifyAuth({ body, url: originalUrl, authorization: headers.authorization })
    if (!verify) {
      return {
        success: false,
        message: 'Authorization fail'
      }
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
      return {
        success: true,
        message: 'ok',
        data: {
          reviewType: 'api',
          reviewUrl: `${headers.host}/peer/trascactions/get?id=${body.txHash}`
        }
      }
    }
  }

  /**
   * @description 获取巡检状态
   * @param {*} {txHash:string,op:string}
   */
  async getInspection$TaskId ({ query, params, headers, originalUrl }) {
    if (!query) {
      query = ''
    }
    console.log(headers)
    if (!headers.authorization) {
      return {
        success: false,
        message: 'Authorization header is required'
      }
    }
    // const verify = await verifyAuth({ query, url: originalUrl, authorization: headers.authorization })
    // if (!verify) {
    //   return {
    //     success: false,
    //     message: 'Authorization fail'
    //   }
    // }
    const status = this.oneoff.get(params.taskid)
    if (!status) {
      return {
        success: false,
        message: 'the taskId is not exist!'
      }
    }
    return {
      success: true,
      message: 'ok',
      data: status
    }
  }

  /**
   * @description 取消巡检
   * @param {*} {txHash:string,op:string}
   */
  async deleteInspection$TaskId ({ query, params, headers, originalUrl }) {
    if (!query) {
      query = ''
    }
    console.log(headers)
    if (!headers.authorization) {
      return {
        success: false,
        message: 'Authorization header is required'
      }
    }
    // const verify = await verifyAuth({ query, url: originalUrl, authorization: headers.authorization })
    // if (!verify) {
    //   return {
    //     success: false,
    //     message: 'Authorization fail'
    //   }
    // }
    const status = this.oneoff.get(params.taskid)
    if (!status) {
      return {
        success: false,
        message: 'the taskId is not exist!'
      }
    }
    this.oneoff.set('inspection', false)
    this.oneoff.set(params.id, { status: 'none', ...status })
    return {
      success: true,
      message: 'ok'
    }
  }

  // 使用symbol模拟私有方法，以防把方法挂在到路由上,循环遍历交易，每次一百条然后上报
  async [look] ({ taskId, limit = 100, offset }) {
    const data = await this[lookTts]({ where: null, limit, offset, orders: null, returnTotal: true })
    const formatTrs = []
    data.rows.map(item => {
      const temp = {
        txHash: item.id,
        content: item.message
      }
      formatTrs.push(temp)
    })
    const result = await checkWord(formatTrs)
    // 敏感词检查出错，直接上报出错原因继续向下检查
    if (result.code !== 0) {
      await reportWord({ trs: null, message: result.message, status: data.rows.length < limit, success: false, taskId })
      if (data.rows.length >= limit && this.oneoff.get('inspection')) {
        const status = this.oneoff.get(taskId)
        this.oneoff.set(taskId, { status: 'running', height: status.height, offset: status.height })
        this[look]({ taskId, limit, offset: offset + limit })
      } else {
        this.oneoff.set('inspection', false)
        const status = this.oneoff.get(taskId)
        const offest = data.rows.length > 0 ? status.height - data.rows[data.rows.length].block_height : status.height
        this.oneoff.set(taskId, { status: 'complete', height: status.height, offest })
      }
      return
    }
    const reportData = await formatReportData({ oldTrs: data.rows, hitsTrs: result.errTrs })
    await reportWord({ trs: reportData, message: result.message, status: data.rows.length < limit, success: true, taskId })
    if (data.rows.length >= limit && this.oneoff.get('inspection')) {
      this[look]({ taskId, limit, offset: offset + limit })
      const status = this.oneoff.get(taskId)
      const offestData = reportData.length > 0 ? status.height - reportData[reportData.length].block_height : status.height

      this.oneoff.set(taskId, { status: 'running', height: status.height, offset: offestData })
    } else {
      this.oneoff.set('inspection', false)
      const status = this.oneoff.get(taskId)
      const offestData = reportData.length > 0 ? status.height - reportData[reportData.length].block_height : status.height
      this.oneoff.set(taskId, { status: 'complete', height: status.height, offset: offestData })
    }
  }

  // 查询交易信息bu包含资产信息
  async [lookTts] ({ where, limit, offset, orders, returnTotal }) {
  //  const data = await this.runtime.dataquery.queryFullTransactionData({ where, limit, offset, orders, returnTotal })
    //   return data
    return new Promise((resolve, reject) => {
      this.dao.findPage(
        'block',
        null,
        1,
        0,
        false,
        [[this.dao.db_fnMax('height'), 'maxHeight']], // wxm block database  library.dao.db_fn('MAX', library.dao.db_col('height'))
        null,
        (err, rows) => {
          if (err || !rows) {
            return reject(err || 'Get Block Error.')
          }

          // let maxHeight = 2
          // if (rows.length > 0) {
          //   maxHeight = rows[0].maxHeight + 1
          // }

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
        }
      )
    })
  }
}

// 敏感词检测
async function checkWord (worlds) {
  const url = '/v1/reg/kw'
  var options = {
    method: 'POST',
    uri: baseUrl + url,
    body: worlds,
    headers: {
      Authorization: await getAuth({ body: worlds, url })
    },
    json: true // Automatically stringifies the body to JSON
  }
  const data = await request(options)
  const errTrs = []
  const result = { message: '', errTrs: [] }
  if (data.code === 0) {
    // 判断是否命中敏感词
    if (data.data.hits.length !== 0) {
      // 遍历敏感词的敏感等级
      data.data.hits.map(item => {
        // 这里判断敏感等级，讨论如果命中敏感词是上报
        if (item.level !== 0) {
          errTrs.push(item.txHash)
        }
      })
    }
    result.message = data.message
    result.code = data.code
    result.errTrs = errTrs
  } else {
    result.message = data.message
    result.errTrs = errTrs
    result.code = data.code
    return result // 如若请求监管系统不成功这里要处理下
  }
  return result
}
// 上报交易
async function reportWord ({ trs, message, taskId, status, success }) {
  if (trs.length === 0 && success) {
    return
  }
  const url = '/v1/reg/inspection/report'
  const body = {
    taskId,
    success,
    message,
    status,
    result: trs
  }
  var options = {
    method: 'POST',
    uri: baseUrl + url,
    body,
    headers: {
      Authorization: await getAuth({ body, url })
    },
    json: true // Automatically stringifies the body to JSON
  }
  let data = await request(options)
  // 上报不成功，重复上报三次
  if (data.code !== 0) {
    let time = 3
    while (time > 0 && data.code !== 0) {
      time--
      data = await await request(options)
    }
  }
  return data
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
          toAcct: oldTrs.recipientId || '0x0',
          content: oldTrs.message || '',
          type: 'normal',
          createdAt: 1585387890

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
async function getAuth ({ body, url }) {
  // const bo = Buffer.from(JSON.stringify(body))
  // const newBody = bo.toString('base64')
  // const ur = Buffer.from(url)
  // const newUrl = ur.toString('base64')
  // const request = newUrl + newBody
  // const data = await getHmacSHA512({ request, key: key })
  const data = await encryption({ body, url })
  const timestamp = Date.parse(new Date()) / 1000
  return 'JG-' + data + '-' + timestamp
}
async function encryption ({ body, url }) {
  const bo = Buffer.from(JSON.stringify(body))
  const newBody = bo.toString('base64')
  const ur = Buffer.from(url)
  const newUrl = ur.toString('base64')
  const request = newUrl + newBody
  const data = await getHmacSHA512({ request, key: key })
  return data
}
async function verifyAuth ({ url, body, authorization }) {
  const reqAuthorization = authorization.split('-')
  const data = encryption({ body, url })
  if (reqAuthorization[1] === data) {
    return true
  } else {
    return false
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
      console.log(temp)
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

export default Supervise
