/**
 * MultisignaturesRouter接口
 * wangxm   2019-03-27
 *
 * Todo: 修改成带有特殊前缀的多重签名账户 2021.6.15 imfly
 */
import * as DdnCrypto from '@ddn/crypto'
import { assetTypes, bignum } from '@ddn/utils'
import { System } from '../../../../utils/system'

class MultisignaturesRouter {
  constructor (context) {
    Object.assign(this, context)
    this._context = context
  }

  /**
   * 在现有账户基础上，创建多重签名账号
   * @param {*} req 'min', 'lifetime', 'keysgroup', 'secret' 是必须的
   */
  async put (req) {
    const body = Object.assign({}, req.body, req.query)
    const validateErrors = await this.ddnSchema.validate(
      {
        type: 'object',
        properties: {
          secret: {
            type: 'string',
            minLength: 1,
            maxLength: 100
          },
          publicKey: {
            type: 'string',
            format: 'publicKey'
          },
          secondSecret: {
            type: 'string',
            minLength: 1,
            maxLength: 100
          },
          min: {
            type: 'integer',
            minimum: 2,
            maximum: 16
          },
          lifetime: {
            type: 'integer',
            minimum: 1,
            maximum: 24
          },
          keysgroup: {
            type: 'array',
            minLength: 1,
            maxLength: 10
          }
        },
        required: ['min', 'lifetime', 'keysgroup', 'secret']
      },
      body
    )
    if (validateErrors) {
      return {
        success: false,
        error: `Validation error: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`
      }
    }

    const keypair = DdnCrypto.getKeys(body.secret)

    if (body.publicKey) {
      if (keypair.publicKey !== body.publicKey) {
        throw new Error('Invalid passphrase')
      }
    }

    return this.balancesSequence.addAsync(async () => {
      const publicKey = keypair.publicKey;

      let account;

      try {
        account = await this.runtime.account.getAccountByPublicKey(publicKey);
      } catch (err) {
        throw err;
      }

      if (!account) {
        throw new Error('Account ' + publicKey + ' not found');
      }

      // fixme: getAccountByPublicKey 方法已经处理
      account.publicKey = publicKey;

      if (account.second_signature && !body.secondSecret) {
        throw new Error('Invalid second passphrase');
      }

      let second_keypair = null;
      if (account.second_signature) {
        second_keypair = DdnCrypto.getKeys(body.secondSecret);
      }

      try {
        const transaction = await this.runtime.transaction.create({
          type: assetTypes.MULTISIGNATURE,
          sender: account,
          keypair,
          second_keypair,
          min: body.min,
          keysgroup: body.keysgroup,
          lifetime: body.lifetime
        });

        const transactions = await this.runtime.transaction.receiveTransactions([transaction]);
        
        setImmediate(async () => {
          try {
            await this.runtime.socketio.emit('multisignatures/change', {});
          } catch (err2) {
            this.logger.error('socket emit error: multisignatures/change', System.getErrorMsg(err2));
          }
        });

        return {
          success: true,
          transactionId: transactions[0].id
        };
      } catch (e) {
        this.logger.error('create multisignatures error', System.getErrorMsg(e));
        throw e;
      }
    });
  }

  async postSign (req) {
    const body = Object.assign({}, req.body, req.query)
    const validateErrors = await this.ddnSchema.validate(
      {
        type: 'object',
        properties: {
          secret: {
            type: 'string',
            minLength: 1,
            maxLength: 100
          },
          secondSecret: {
            type: 'string',
            minLength: 1,
            maxLength: 100
          },
          publicKey: {
            type: 'string',
            format: 'publicKey'
          },
          transactionId: {
            type: 'string'
          }
        },
        required: ['transactionId', 'secret']
      },
      body
    )
    if (validateErrors) {
      return {
        success: false,
        error: `Validation error: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`
      }
    }

    const transaction = await this.runtime.transaction.getUnconfirmedTransaction(body.transactionId)
    if (!transaction) {
      throw new Error('Transaction not found')
    }

    const keypair = DdnCrypto.getKeys(body.secret)

    if (body.publicKey) {
      if (keypair.publicKey !== body.publicKey) {
        throw new Error('Invalid passphrase')
      }
    }
    const newTrs = JSON.parse(JSON.stringify(transaction))
    delete newTrs.senderId
    const sign = await DdnCrypto.sign(newTrs, keypair)

    if (transaction.type === assetTypes.MULTISIGNATURE) {
      if (
        !transaction.asset.multisignature.keysgroup.includes(`+${keypair.publicKey}`) ||
        (transaction.signatures && transaction.signatures.includes(sign.toString('hex')))
      ) {
        // 是多重签名交易（asset），但签名者不属于签名组里的人，也不在交易的多个签名里
        throw new Error('1. Permission to sign transaction denied')
      }

      setImmediate(async () => {
        try {
          await this.runtime.socketio.emit('multisignatures/singature/change', {})
        } catch (err) {
          this.logger.error('socket emit error: multisignatures/singature/change')
        }
      })
    } else {
      const account = await this.runtime.account.getAccountByAddress(transaction.senderId)
      if (!account) {
        throw new Error('Account ' + transaction.senderId + ' not found')
      }

      if (!transaction.requester_public_key) {
        // wxm block database
        if (!account.multisignatures.includes(keypair.publicKey)) {
          // 不是多重签名交易，交易也没有接收方，交易发起者的多重签名里，也不包含该交易发起者的公钥（transaction.senderId ！== keypair.publicKey）
          this.logger.error('multisignatures trs', transaction)
          throw new Error('2. Permission to sign transaction denied')
        }
      } else {
        if (account.publicKey !== keypair.publicKey || transaction.senderPublicKey !== keypair.publicKey) {
          // 交易有接收方，但交易发起者与当前操作的用户不一致
          throw new Error('3. Permission to sign transaction denied')
        }
      }

      if (transaction.signatures && transaction.signatures.includes(sign)) {
        // 已经签过名
        throw new Error('4. Permission to sign transaction denied')
      }

      setImmediate(async () => {
        try {
          await this.runtime.socketio.emit('multisignatures/singature/change', {})
        } catch (err) {
          this.logger.error('socket emit error: multisignatures/singature/change')
        }
      })
    }

    return this.balancesSequence.addAsync(async () => {
      const transaction = await this.runtime.transaction.getUnconfirmedTransaction(body.transactionId);
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      transaction.signatures = transaction.signatures || [];
      transaction.signatures.push(sign);

      setImmediate(async () => {
        try {
          await this.runtime.peer.broadcast.broadcastNewSignature({
            signature: sign,
            transaction: transaction.id
          });
        } catch (err) {
          this.logger.error(`Broadcast new signature failed: ${System.getErrorMsg(err)}`);
        }
      });

      return {
        success: true,
        transactionId: transaction.id
      };
    });
  }

  async getPending (req) {
    const query = Object.assign({}, req.body, req.query)
    const validateErrors = await this.ddnSchema.validate(
      {
        type: 'object',
        properties: {
          publicKey: {
            type: 'string',
            format: 'publicKey'
          }
        },
        required: ['publicKey']
      },
      query
    )
    if (validateErrors) {
      return {
        success: false,
        error: `Validation error: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`
      }
    }

    let transactions = await this.runtime.transaction.getUnconfirmedTransactionList()

    if (query.isOutTransfer) {
      transactions = transactions.filter(({ type }) => type === assetTypes.DAPP_OUT)
    }

    const pendings = []
    for (let i = 0; i < transactions.length; i++) {
      const item = transactions[i]

      let signed = false
      let verify = false

      if (!verify && item.signatures && item.signatures.length > 0) {
        for (const i in item.signatures) {
          const signature = item.signatures[i]

          try {
            verify = await this.runtime.transaction.verifySignature(item, signature, query.publicKey)
          } catch (e) {
            this.logger.error('/multisignatures/pending verify fail, error is ', System.getErrorMsg(e))
            verify = false
          }

          if (verify) {
            break
          }
        }

        if (verify) {
          signed = true
        }
      }

      if (!signed && item.senderPublicKey === query.publicKey) {
        // wxm block database
        signed = true
      }

      try {
        const sender = await this.runtime.account.getAccountByPublicKey(item.senderPublicKey)
        if (!sender) {
          break
        }

        if (
          (sender.publicKey === query.publicKey && sender.u_multisignatures.length > 0) ||
          sender.u_multisignatures.includes(query.publicKey) ||
          sender.multisignatures.includes(query.publicKey)
        ) {
          const min = sender.u_multimin || sender.multimin
          const lifetime = sender.u_multilifetime || sender.multilifetime
          const signatures = sender.u_multisignatures.length

          pendings.push({
            max: signatures.length,
            min,
            lifetime,
            signed,
            transaction: item
          })
        }
      } catch (err) {
        break
      }
    }

    return {
      success: true,
      transactions: pendings
    }
  }

  async getAccounts (req) {
    const query = Object.assign({}, req.body, req.query)

    const validateErrors = await this.ddnSchema.validate(
      {
        type: 'object',
        properties: {
          publicKey: {
            type: 'string',
            format: 'publicKey'
          }
        },
        required: ['publicKey']
      },
      query
    )
    if (validateErrors) {
      return {
        success: false,
        error: `Validation error: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`
      }
    }

    try {
      const rows = await this.dao.findList('mem_accounts2multisignature', {
        where: { dependent_id: query.publicKey },
        attributes: [[this.dao.db_fnGroupConcat('account_id'), 'account_id']]
      })
      let addresses = []

      if (rows[0] && rows[0].account_id) {
        addresses = rows[0].account_id.split(',') // wxm block database
      }

      try {
        const rows = await this.runtime.account.getAccountList(
          {
            address: {
              $in: addresses
            },
            sort: [['balance', 'ASC']] // wxm block database
          },
          ['address', 'balance', 'multisignatures', 'multilifetime', 'multimin']
        )

        for (let i = 0; i < rows.length; i++) {
          const account = rows[i]

          const addresses = []
          for (let j = 0; j < account.multisignatures.length; j++) {
            addresses.push(this.runtime.account.generateAddressByPublicKey(account.multisignatures[j]))
          }

          const multisigaccounts = await this.runtime.account.getAccountList(
            {
              address: {
                $in: addresses
              }
            },
            ['address', 'publicKey', 'balance']
          )

          account.multisigaccounts = multisigaccounts
        }

        return {
          success: true,
          accounts: rows
        }
      } catch (e) {
        this.logger.error('findList: ', System.getErrorMsg(e))
        throw e
      }
    } catch (err) {
      this.logger.error('Can`t find multisignatures, ', System.getErrorMsg(err))
      throw err
    }
  }

  async getFee () {
    return {
      success: true,
      fee: bignum.multiply(this.constants.net.fees.multisignature, this.constants.fixedPoint).toFixed()
    }
  }

  /**
   * 获取交易的签名进度和状态
   * 
   * get /api/multisignatures/signatureProgress?transactionId=交易ID
   * 
   * @param {*} req 请求对象，包含交易ID
   * @returns {Object} 包含交易签名进度的对象 
   * 
   * Object 包含信息：
   *   - 交易基本信息（ID、类型、发送者）
   *   - 所需签名数和当前签名数
   *   - 已签名的账户列表
   *   - 待签名的账户列表
   *   - 签名进度百分比
   *   - 交易是否已准备好执行
   *   - 交易过期时间和是否已过期
   */
  async getSignatureProgress(req) {
    const query = Object.assign({}, req.body, req.query)
    const validateErrors = await this.ddnSchema.validate(
      {
        type: 'object',
        properties: {
          transactionId: {
            type: 'string'
          }
        },
        required: ['transactionId']
      },
      query
    )
    if (validateErrors) {
      return {
        success: false,
        error: `Validation error: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`
      }
    }

    try {
      // 获取未确认的交易
      const transaction = await this.runtime.transaction.getUnconfirmedTransaction(query.transactionId)
      if (!transaction) {
        return {
          success: false,
          error: 'Transaction not found or already confirmed'
        }
      }

      // 获取交易发送者账户
      const sender = await this.runtime.account.getAccountByAddress(transaction.senderId)
      if (!sender) {
        return {
          success: false,
          error: 'Sender account not found'
        }
      }

      // 计算签名进度
      let requiredSignatures = 0
      let currentSignatures = 0
      let signers = []
      let pendingSigners = []
      
      // 处理多重签名资产类型交易
      if (transaction.type === assetTypes.MULTISIGNATURE) {
        requiredSignatures = transaction.asset.multisignature.min
        currentSignatures = transaction.signatures ? transaction.signatures.length : 0
        
        // 获取已签名的公钥列表
        const signedPublicKeys = []
        if (transaction.signatures && transaction.signatures.length > 0) {
          for (const signature of transaction.signatures) {
            for (const publicKey of transaction.asset.multisignature.keysgroup.map(key => key.substring(1))) {
              try {
                const newTrs = JSON.parse(JSON.stringify(transaction))
                delete newTrs.senderId
                const verify = await DdnCrypto.verifyBytes(DdnCrypto.getBytes(newTrs, false, false), signature, publicKey)
                if (verify) {
                  signedPublicKeys.push(publicKey)
                  break
                }
              } catch (e) {
                this.logger.error('Verify signature error:', System.getErrorMsg(e))
              }
            }
          }
        }
        
        // 获取已签名和待签名的账户信息
        for (const key of transaction.asset.multisignature.keysgroup) {
          const publicKey = key.substring(1)
          try {
            const account = await this.runtime.account.getAccountByPublicKey(publicKey)
            if (signedPublicKeys.includes(publicKey)) {
              signers.push({
                address: account ? account.address : 'Unknown',
                publicKey
              })
            } else {
              pendingSigners.push({
                address: account ? account.address : 'Unknown',
                publicKey
              })
            }
          } catch (e) {
            this.logger.error('Get account error:', System.getErrorMsg(e))
            pendingSigners.push({
              address: 'Unknown',
              publicKey
            })
          }
        }
      } else {
        // 处理普通多重签名交易
        if (!sender.multisignatures || !sender.multisignatures.length) {
          return {
            success: false,
            error: 'Not a multisignature account'
          }
        }
        
        requiredSignatures = sender.multimin || 0
        currentSignatures = transaction.signatures ? transaction.signatures.length : 0
        
        // 获取已签名的公钥列表
        const signedPublicKeys = []
        if (transaction.signatures && transaction.signatures.length > 0) {
          for (const signature of transaction.signatures) {
            for (const publicKey of sender.multisignatures) {
              try {
                const newTrs = JSON.parse(JSON.stringify(transaction))
                delete newTrs.senderId
                const verify = await DdnCrypto.verifyBytes(DdnCrypto.getBytes(newTrs, false, false), signature, publicKey)
                if (verify) {
                  signedPublicKeys.push(publicKey)
                  break
                }
              } catch (e) {
                this.logger.error('Verify signature error:', System.getErrorMsg(e))
              }
            }
          }
        }
        
        // 获取已签名和待签名的账户信息
        for (const publicKey of sender.multisignatures) {
          try {
            const account = await this.runtime.account.getAccountByPublicKey(publicKey)
            if (signedPublicKeys.includes(publicKey)) {
              signers.push({
                address: account ? account.address : 'Unknown',
                publicKey
              })
            } else {
              pendingSigners.push({
                address: account ? account.address : 'Unknown',
                publicKey
              })
            }
          } catch (e) {
            this.logger.error('Get account error:', System.getErrorMsg(e))
            pendingSigners.push({
              address: 'Unknown',
              publicKey
            })
          }
        }
      }

      // 计算交易过期时间
      let expirationTime = null
      if (transaction.type === assetTypes.MULTISIGNATURE) {
        const lifetime = transaction.asset.multisignature.lifetime * 3600 // 小时转秒
        expirationTime = transaction.timestamp + lifetime
      } else if (sender.multilifetime) {
        const lifetime = sender.multilifetime * 3600 // 小时转秒
        expirationTime = transaction.timestamp + lifetime
      }

      // 检查交易是否已过期
      const currentTime = this.runtime.slot.getTime()
      const isExpired = expirationTime && currentTime > expirationTime

      return {
        success: true,
        transaction: {
          id: transaction.id,
          type: transaction.type,
          senderId: transaction.senderId,
          requiredSignatures,
          currentSignatures,
          signers,
          pendingSigners,
          progress: requiredSignatures > 0 ? (currentSignatures / requiredSignatures) * 100 : 0,
          isReady: currentSignatures >= requiredSignatures,
          expirationTime,
          isExpired
        }
      }
    } catch (err) {
      this.logger.error('Failed to get signature progress: ', System.getErrorMsg(err))
      return {
        success: false,
        error: System.getErrorMsg(err)
      }
    }
  }

  /**
   * 获取用户已签名的交易
   * 
   * get /api/multisignatures/signatures?publicKey=用户公钥
   * 
   * @param {*} req 请求对象，包含用户公钥
   * @returns {Object} 包含已签名交易列表的对象
   */
  async getSignatures(req) {
    const query = Object.assign({}, req.body, req.query)
    const validateErrors = await this.ddnSchema.validate(
      {
        type: 'object',
        properties: {
          publicKey: {
            type: 'string',
            format: 'publicKey'
          }
        },
        required: ['publicKey']
      },
      query
    )
    if (validateErrors) {
      return {
        success: false,
        error: `Validation error: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`
      }
    }

    try {
      // 获取所有未确认的交易
      let transactions = await this.runtime.transaction.getUnconfirmedTransactionList()
      
      // 筛选出用户已签名的交易
      const signedTransactions = []
      
      for (let i = 0; i < transactions.length; i++) {
        const transaction = transactions[i]
        
        // 检查交易是否有签名
        if (transaction.signatures && transaction.signatures.length > 0) {
          let isSigned = false
          
          // 验证用户是否已对该交易签名
          for (const signature of transaction.signatures) {
            try {
              const verify = await this.runtime.transaction.verifySignature(
                transaction, 
                signature, 
                query.publicKey
              )
              
              if (verify) {
                isSigned = true
                break
              }
            } catch (e) {
              this.logger.error('/multisignatures/signatures verify fail, error is ', System.getErrorMsg(e))
            }
          }
          
          // 如果用户已签名，添加到结果中
          if (isSigned) {
            signedTransactions.push(transaction)
          }
        }
      }
      
      return {
        success: true,
        transactions: signedTransactions
      }
    } catch (err) {
      this.logger.error('Failed to get signatures: ', System.getErrorMsg(err))
      throw err
    }
  }
}

export default MultisignaturesRouter
