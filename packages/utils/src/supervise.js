const baseUrl = ' http://114.55.142.90' // 监管的host
const request = require('request-promise')
// 敏感词检测
export async function checkWord (that, worlds) {
  const url = '/v1/reg/kw'
  var options = {
    method: 'POST',
    uri: baseUrl + url,
    body: worlds,
    // headers: {
    //   Authorization: await getAuth({ body: worlds, url })
    // },
    json: true // Automatically stringifies the body to JSON
  }
  let data
  try {
    data = await request(options)
  } catch (error) {
    that.logger.error('/v1/reg/kw error:', error)
  }
  const errTrs = []
  const result = { message: '', errTrs: [], code: data.code, originalData: data }
  that.logger.debug(`/v1/reg/kw ${JSON.stringify(data)}`)
  that.logger.debug(`/v1/reg/kw ${JSON.stringify(data)}`, data)
  if (data.code === 0) {
    // 判断是否命中敏感词
    if (data.data.hits.length !== 0) {
      // 遍历敏感词的敏感等级
      data.data.hits.map(item => {
        // 这里判断敏感等级，讨论如果命中敏感词是上报
        if (item.level !== -1) {
          errTrs.push(item.txHash)
        }
      })
    }
    result.message = data.message
    result.errTrs = errTrs
  } else {
    that.logger.error(`/v1/reg/kw ${data.message}`, data)
    let time = 3
    while (time > 0 && data.code !== 0) {
      time--
      try {
        data = await request(options)
      } catch (error) {
        that.logger.error('/v1/reg/kw error:', error)
      }
    }
    if (data.code === 0) {
      // 判断是否命中敏感词
      if (data.data.hits.length !== 0) {
        // 遍历敏感词的敏感等级
        data.data.hits.map(item => {
          // 这里判断敏感等级，讨论如果命中敏感词是上报
          if (item.level !== -1) {
            errTrs.push(item.txHash)
          }
        })
      }
    } else {
      result.message = data.message
      result.errTrs = errTrs
      // result.message = data.message
      // // result.errTrs = errTrs
      result.code = data.code
    }
    return result
  }
  return result
}
// 上报交易
export async function reportWord ({ trs, message, taskId, status, success, that }) {
  // if (trs.length === 0 && success) {
  //   return
  // }
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
    // headers: {
    //   Authorization: await getAuth({ body, url })
    // },
    json: true // Automatically stringifies the body to JSON
  }
  let data
  try {
    data = await request(options)
  } catch (error) {
    that.logger.error('/v1/reg/inspection/report: ', error)
  }
  // 上报不成功，重复上报三次
  if (data.code !== 0) {
    that.logger.error(`/v1/reg/inspection/report: ${data.message}`)
    let time = 3
    while (time > 0 && data.code !== 0) {
      time--
      try {
        data = await request(options)
      } catch (error) {
        that.logger.error('/v1/reg/inspection/report: ', error)
      }
    }
  }
  return data
}
export async function beforeSaveReportWord ({ txHash, fromAcct = 0x0, toAcct = 0x0, content, type = 'normal', op = 'accept', createdAt = parseInt(new Date().getTime() / 1000), that }) {
  // if (trs.length === 0 && success) {
  //   return
  // }
  const url = '/v1/reg/report'
  const body = {
    txHash,
    fromAcct,
    toAcct,
    content,
    type,
    op,
    createdAt
  }
  var options = {
    method: 'POST',
    uri: baseUrl + url,
    body,
    // headers: {
    //   Authorization: await getAuth({ body, url })
    // },
    json: true // Automatically stringifies the body to JSON
  }
  let data
  try {
    data = await request(options)
  } catch (error) {
    that.logger.error('/v1/reg/inspection/report: ', error)
  }
  // 上报不成功，重复上报三次
  if (data.code !== 0) {
    that.logger.error(`/v1/reg/report ${JSON.stringify(data)}`)
    let time = 3
    while (time > 0 && data.code !== 0) {
      time--
      try {
        data = await request(options)
      } catch (error) {
        that.logger.error('/v1/reg/inspection/report: ', error)
      }
    }
  }
  that.logger.debug(`/v1/reg/report success ${JSON.stringify(data)}`, data)
  return data
}
// 交易上链前敏感词检测
export async function checkAndReport (transaction, that, cb) {
  if (transaction.message) {
    const res = await checkWord(that, [{ content: transaction.message, txHash: transaction.id }])
    let sensitive = false
    if (res.code === 0) {
      const hits = res.originalData.data.hits
      for (let index = 0; index < hits.length; index++) {
        const element = hits[index]
        if (element.level === 10 || element.level === 0) {
          beforeSaveReportWord({ txHash: element.txHash, fromAcct: transaction.sender, toAcct: transaction.recipientId, content: transaction.message, type: 'normal', op: 'reject', that })
          sensitive = true
        } else if (element.level === 1 || element.level === 2) {
          beforeSaveReportWord({ txHash: element.txHash, fromAcct: transaction.sender, toAcct: transaction.recipientId, content: transaction.message, type: 'normal', op: 'accept', that })
        }
      }
      if (sensitive) {
        if (cb) {
          cb('message include sensitive words')
        } else {
          return { success: false, message: 'message include sensitive words' }
        }
      } else {
        that.logger.debug('check words uninclude sensitive: ', res)
        return { success: true, message: 'message uninclude sensitive words' }
      }
    } else {
      that.logger.error('check words error but save trs err: ', res)
      return { success: true, message: 'check words error but save trs:' }
    }
  } else {
    return { success: true }
  }
}
/**
 * @author wly 2010-10-22
 * @description 查询被屏蔽的交易，返回屏蔽后的交易信息
 */
export async function superviseTrs ({ context, trs }) {
  let trsTypeIsArray = true
  if (!Array.isArray(trs)) {
    trsTypeIsArray = false
    trs = [trs]
  }
  const trsIds = trs.map(item => item.id)
  const data = await new Promise((resolve) => {
    context.dao.findList('supervise', {
      txHash: {
        $in: trsIds
      }
    }, null, null, (err, rows) => {
      if (err) {
        resolve(err)
      } else {
        resolve(rows)
      }
    })
  })
  if (data && data.length === 0) {
    if (trsTypeIsArray) {
      return trs
    } else {
      return trs[0]
    }
  }
  trs.map(item => {
    data.map(supervise => {
      if (item.id === supervise.txHash && supervise.op === 'destroy') {
        item.message = '内容违反相关法规，不予显示'
        return item
      } else {
        return item
      }
    })
  })
  if (trsTypeIsArray) {
    return trs
  } else {
    return trs[0]
  }
}
