/**
 * Signature Sync
 * 负责处理多重签名的同步操作
 */

let _singleton

export class SignatureSync {
  static singleton(context) {
    if (!_singleton) {
      _singleton = new SignatureSync(context)
    }
    return _singleton
  }

  constructor(context) {
    Object.assign(this, context)
    this._context = context
  }

  /**
   * 从其他节点同步多重签名数据
   * @returns {Promise<boolean>} 同步是否成功
   */
  async syncSignatures() {
    let res
    let retryCount = 0
    const maxRetries = 3
    const retryDelay = 1000 // 1秒延迟

    // 尝试获取签名数据，最多重试3次
    while (retryCount < maxRetries) {
      try {
        res = await this.runtime.peer.p2p.get('/signature')
        break
      } catch (err) {
        retryCount++
        this.logger.error(`Sync Signatures attempt ${retryCount} failed: ${err}`)

        if (retryCount === maxRetries) {
          this.logger.error(`Sync Signatures has error after ${maxRetries} attempts: ${err}`)
          return false
        }

        await new Promise(resolve => setTimeout(resolve, retryDelay))
      }
    }

    // 检查响应是否有效
    if (!res || !res.body || !res.body.success) {
      return false
    }

    const body = res.body

    // 验证响应数据格式
    const validateErrors = await this.ddnSchema.validate(
      {
        type: 'object',
        properties: {
          signatures: {
            type: 'array',
            uniqueItems: true
          }
        },
        required: ['signatures']
      },
      body
    )
    if (validateErrors) {
      this.logger.error(`${validateErrors[0].schemaPath} ${validateErrors[0].message}`)
      return false
    }

    // 处理签名数据
    try {
      await this.sequence.addAsync(async () => {
        for (let i = 0; i < body.signatures.length; i++) {
          const signature = body.signatures[i];
          for (let j = 0; j < signature.signatures.length; j++) {
            await this.runtime.multisignature.processSignature({
              signature: signature.signatures[j],
              transaction: signature.transaction
            });
          }
        }
      });
      return true
    } catch (err) {
      this.logger.error(`Error processing signatures: ${err.message || err}`)
      return false
    }
  }

  /**
   * 启动签名同步任务（轮询）
   * @param {number} interval 同步间隔，单位为秒，默认为14秒
   */
  async startSyncTask(interval = 14) {
    try {
      await this.syncSignatures()
    } catch (err) {
      this.logger.warn(`The signatures sync task error: ${err.message || err}`)
    }

    setTimeout(() => {
      this.startSyncTask(interval)
    }, 1000 * interval)
  }
}

export default SignatureSync
