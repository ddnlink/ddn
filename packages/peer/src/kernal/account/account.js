/* eslint-disable promise/param-names */
/**
 * 区块数据核心处理逻辑和方法
 * wangxm   2018-12-27
 */
import DdnUtils from '@ddn/utils'

let _singleton

class Account {
  static singleton (context) {
    if (!_singleton) {
      _singleton = new Account(context)
    }
    return _singleton
  }

  constructor (context) {
    // context.runtime.account = this;

    Object.assign(this, context)
    this._context = context

    this._fieldTypes = {
      username: String,
      is_delegate: Boolean,
      u_is_delegate: Boolean,
      second_signature: Boolean,
      u_second_signature: Boolean,
      u_username: String,
      address: String,
      publicKey: String,
      second_public_key: String,
      balance: Number,
      u_balance: Number,
      vote: Number,
      rate: Number,
      delegates: Array,
      u_delegates: Array,
      multisignatures: Array,
      u_multisignatures: Array,
      multimin: Number,
      u_multimin: Number,
      multilifetime: Number,
      u_multilifetime: Number,
      block_id: String,
      nameexist: Boolean,
      u_nameexist: Boolean,
      producedblocks: Number,
      missedblocks: Number,
      fees: Number,
      rewards: Number,
      lock_height: Number
    }

    this._editable = [
      'is_delegate', // wxm block database
      'u_is_delegate', // wxm block database
      'second_signature', // wxm block database
      'u_second_signature', // wxm block database
      'balance',
      'u_balance',
      'vote',
      'rate',
      'delegates',
      'u_delegates',
      'multisignatures',
      'u_multisignatures',
      'multimin',
      'u_multimin',
      'multilifetime',
      'u_multilifetime',
      'block_id', // wxm block database
      'nameexist',
      'u_nameexist',
      'producedblocks',
      'missedblocks',
      'fees',
      'rewards',
      'lock_height' // wxm block database
    ]
  }

  async initAccountsAndBalances () {
    const verify = this.config.loading.verifyOnLoading
    const count = await this.runtime.block.getCount()
    if (verify || count === 1) {
      await this.repairAccounts(count, true)
    } else {
      await this.checkAccounts(count)
    }

    return true
  }

  /**
   * @description 暂时未使用
   * @todo 下一步要优化成使用观察者模式使用该方法，和asset onInitAccountsAndBalances调用方式一样
   * @author wly
   * @copyright 2021-01-05
   */
  async onInitAccountsAndBalances () {
    await this.initAccountsAndBalances()
  }

  isAddress (address) {
    return this.address.isAddress(address)
  }

  /**
   * TODO: 使用 crypto.generateAddress(publicKey, tokenPrefix);
   * 根据公钥生成钱包地址
   * @param {*} publicKey
   */
  generateAddressByPublicKey (publicKey) {
    return this.address.generateAddress(publicKey)
  }

  /**
   * 设置账户信息（有则修改，没有则新增）
   * @param {*} data 账户信息，address或public_key必有其一
   * @param {*} dbTrans
   */
  async setAccount (data, dbTrans) {
    let address = data.address
    if (!address && data.publicKey) {
      address = this.generateAddressByPublicKey(data.publicKey) // wxm block database
      delete data.isGenesis
    }
    if (!address) {
      this.logger.error('setAccount error and data is:', data)
      throw new Error('Missing address or public key in setAccount')
    }
    data.address = address

    return await this.dao.insertOrUpdate('mem_account', data, { transaction: dbTrans })
  }

  async getAccountByAddress (address, dbTrans) {
    return await this.getAccount({ address }, null, dbTrans)
  }

  async getAccountByPublicKey (publicKey, dbTrans) {
    publicKey = publicKey.toString('hex')
    const address = this.generateAddressByPublicKey(publicKey)
    this.logger.debug('getAccountByPublicKey, publicKey -> address; ' + publicKey + ' -> ' + address)
    const account = await this.getAccount({ address }, null, dbTrans)

    if (account && !account.publicKey) {
      account.publicKey = publicKey
    }

    return account
  }

  /**
   * 可通过address, publicKey, username 查询账户
   * @param {*} where
   * @param {*} attributes
   * @param {*} dbTrans
   * @returns
   */
  async getAccount (where, attributes, dbTrans) {
    const address = (where || {}).address
    const publicKey = (where || {}).publicKey
    const username = (where || {}).username
    if ((!address || typeof address !== 'string' || !this.isAddress(address)) && !publicKey && !username) {
      this.logger.error('account address', address, 'or publicKey: ', publicKey)
      throw new Error('Invalid address or publicKey getAccount')
    }

    // return await this.dao.findPage('mem_account', filter, limit || 1000, offset, false, fields || null, sort)

    const mem_account = await this.dao.findOne('mem_account', { where, attributes, transaction: dbTrans })
    if (!mem_account) return
    const delegates = await this.dao.findList('mem_accounts2delegate', {
      where: {
        account_id: mem_account.address
      },
      attributes: [['dependent_id', 'delegates'], 'account_id'],
      transaction: dbTrans
    })

    const u_delegates = await this.dao.findList('mem_accounts2u_delegate', {
      where: {
        account_id: mem_account.address
      },
      attributes: [['dependent_id', 'u_delegates'], 'account_id'],
      transaction: dbTrans
    })
    const multisignatures = await this.dao.findList('mem_accounts2multisignature', {
      where: {
        account_id: mem_account.address
      },
      attributes: [['dependent_id', 'multisignatures'], 'account_id'],
      transaction: dbTrans
    })
    const u_multisignatures = await this.dao.findList('mem_accounts2u_multisignature', {
      where: {
        account_id: mem_account.address
      },
      attributes: [['dependent_id', 'u_multisignatures'], 'account_id'],
      transaction: dbTrans
    })

    return {
      ...mem_account,
      delegates: delegates.map(({ delegates }) => delegates),
      u_delegates: u_delegates.map(({ u_delegates }) => u_delegates),
      multisignatures: multisignatures.map(({ multisignatures }) => multisignatures),
      u_multisignatures: u_multisignatures.map(({ u_multisignatures }) => u_multisignatures)
    }
  }

  // todo: 优化该方法，减少检索处理
  async getAccountList (filter, fields, dbTrans) {
    let limit, offset, sort

    if (filter.limit > 0) {
      limit = filter.limit
    }
    delete filter.limit
    if (filter.offset > 0) {
      offset = filter.offset
    }
    delete filter.offset
    if (filter.sort) {
      sort = filter.sort
    }
    delete filter.sort

    if (typeof filter.address === 'string' && !this.isAddress(filter.address)) {
      this.logger.error('account address', filter.address)
      throw new Error('Invalid address getAccount')
    }

    // return await this.dao.findPage('mem_account', filter, limit || 1000, offset, false, fields || null, sort)

    let mem_accounts = await this.dao.findList('mem_account', {
      where: filter,
      limit: limit || 1000,
      offset,
      attributes: fields,
      order: sort,
      transaction: dbTrans
    })

    // FIXME: 优化到其他方法中去 2020.8.8
    const mem_account_ids = mem_accounts.map(({ address }) => address)

    let delegates = []
    let u_delegates = []
    let multisignatures = []
    let u_multisignatures = []
    if (mem_account_ids.length > 0) {
      delegates = await this.dao.findListByGroup('mem_accounts2delegate', {
        where: {
          account_id: {
            $in: mem_account_ids
          } // wxm block database
        },
        limit: mem_account_ids.length,
        offset: 0,
        group: ['account_id'],
        attributes: [[this.dao.db_fnGroupConcat('dependent_id'), 'delegates'], 'account_id'],
        transaction: dbTrans
      })
      u_delegates = await this.dao.findListByGroup('mem_accounts2u_delegate', {
        where: {
          account_id: {
            // wxm block database
            $in: mem_account_ids
          }
        },
        limit: mem_account_ids.length,
        offset: 0,
        group: ['account_id'],
        attributes: [[this.dao.db_fnGroupConcat('dependent_id'), 'u_delegates'], 'account_id'],
        transaction: dbTrans
      })
      multisignatures = await this.dao.findListByGroup('mem_accounts2multisignature', {
        where: {
          account_id: {
            // wxm block database
            $in: mem_account_ids
          }
        },
        limit: mem_account_ids.length,
        offset: 0,
        group: ['account_id'],
        attributes: [[this.dao.db_fnGroupConcat('dependent_id'), 'multisignatures'], 'account_id'],
        transaction: dbTrans
      })
      u_multisignatures = await this.dao.findListByGroup('mem_accounts2u_multisignature', {
        where: {
          account_id: {
            // wxm block database
            $in: mem_account_ids
          }
        },
        limit: mem_account_ids.length,
        offset: 0,
        group: ['account_id'],
        attributes: [[this.dao.db_fnGroupConcat('dependent_id'), 'u_multisignatures'], 'account_id'],
        transaction: dbTrans
      })
    }

    mem_accounts = mem_accounts.map(mem_account => {
      const delegates_item = delegates.find(
        ({
          account_id, // wxm block database
          delegates
        }) => account_id === mem_account.address && delegates
      ) // wxm block database
      const u_delegates_item = u_delegates.find(
        ({
          account_id, // wxm block database
          u_delegates
        }) => account_id === mem_account.address && u_delegates
      ) // wxm block database
      const multisignatures_item = multisignatures.find(
        ({
          account_id, // wxm block database
          multisignatures
        }) => account_id === mem_account.address && multisignatures
      ) // wxm block database
      const u_multisignatures_item = u_multisignatures.find(
        ({
          account_id, // wxm block database
          u_multisignatures
        }) => account_id === mem_account.address && u_multisignatures
      ) // wxm block database

      const result2 = Object.assign({}, mem_account, {
        delegates: delegates_item ? delegates_item.delegates.split(',') : [],
        u_delegates: u_delegates_item ? u_delegates_item.u_delegates.split(',') : [],
        multisignatures: multisignatures_item ? multisignatures_item.multisignatures.split(',') : [],
        u_multisignatures: u_multisignatures_item ? u_multisignatures_item.u_multisignatures.split(',') : []
      })
      return result2
    })

    return mem_accounts
  }

  async getMultisignaturAccount (ids) {
    await this.dao.findListByGroup('mem_accounts2multisignature', {
      where: {
        account_id: {
          $in: ids
        }
      },
      limit: ids.length,
      offset: 0,
      group: ['account_id'],
      attributes: [[this.dao.db_fnGroupConcat('dependent_id'), 'multisignatures'], 'account_id']
    })

    await this.dao.findListByGroup('mem_accounts2u_multisignature', {
      where: {
        account_id: {
          $in: ids
        }
      },
      limit: ids.length,
      offset: 0,
      group: ['account_id'],
      attributes: [[this.dao.db_fnGroupConcat('dependent_id'), 'u_multisignatures'], 'account_id']
    })
  }

  async cacheAllAccountBalances () {
    const pageSize = 5000
    let pageIndex = 0

    while (true) {
      const list = await this.dao.findList('mem_account', {
        limit: pageSize,
        offset: pageIndex * pageSize,
        attributes: ['address', 'balance']
      })

      pageIndex++

      if (list && list.length > 0) {
        for (let i = 0; i < list.length; i++) {
          const { address, balance } = list[i]
          this.balanceCache.setNativeBalance(address, balance)
        }
        this.balanceCache.commit()

        if (list.length < pageSize) {
          break
        }
      } else {
        break
      }
    }
  }

  /**
   * 重建账户和余额信息（根据已有区块信息）
   * @param {number} count 区块总数
   * @param {boolean} verify 是否验证区块
   * @param {number} startHeight 开始修复的高度，默认为0（从创世区块开始）
   * @param {boolean} clearAccounts 是否清空账户表，默认为true
   */
  async repairAccounts (count, verify, startHeight = 0, clearAccounts = true) {
    if (typeof count === 'undefined') {
      count = await this.runtime.block.getCount()
    }

    // 如果指定了开始高度，并且不是从头开始修复，则不清空账户表
    if (clearAccounts) {
      this.logger.info(`Clearing account tables for full repair from height ${startHeight}`)
      await this.dao.clear('mem_account', true)
      await this.dao.clear('mem_round', true)
      await this.dao.clear('mem_accounts2u_delegate', true)

      const sql = 'INSERT INTO mem_accounts2u_delegates SELECT * FROM mem_accounts2delegates;'
      await this.dao.execSql(sql)
    } else {
      this.logger.info(`Performing partial repair from height ${startHeight} without clearing accounts`)
    }

    let offset = startHeight
    const limit = Number(this.config.loading.loadPerIteration) || 1000
    verify = verify || this.config.loading.verifyOnLoading

    try {
      // 如果是从头开始修复，则设置最后区块为null
      if (startHeight === 0) {
        this.runtime.block.setLastBlock(null)
      } else {
        // 如果是从中间某个高度开始修复，则需要先获取该高度的前一个区块
        const previousHeight = Math.max(0, startHeight - 1)
        const previousBlock = await this.dao.findOne('block', {
          where: { height: previousHeight.toString() },
          order: [['height', 'DESC']]
        })

        if (previousBlock) {
          this.runtime.block.setLastBlock(previousBlock)
        } else {
          this.logger.warn(`Could not find block at height ${previousHeight}, starting from genesis block`)
          this.runtime.block.setLastBlock(null)
          offset = 0 // 重置偏移量为0
        }
      }

      while (count >= offset) {
        if (count > 1) {
          this.logger.info(`Rebuilding blockchain, current block height:${offset}`)
        }

        await this.runtime.block.loadBlocksOffset(limit, offset, verify)
        offset += limit
      }

      await this.cacheAllAccountBalances()

      this.logger.info(`repairAccounts is ok (from height ${startHeight}), Blockchain ready`)
    } catch (err) {
      this.logger.error('loadBlocksOffset', err)

      // wxm TODO 此处的block属性不知道哪里赋值的，待确认
      if (err && err.block) {
        this.logger.error('Blockchain failed at ', err.block.height)

        await this.runtime.block.simpleDeleteAfterBlock(err.block.height)

        this.logger.error('Blockchain clipped')

        await this.cacheAllAccountBalances()
      } else {
        throw err
      }
    }
  }

  /**
   * 检查钱包账户数据完整性
   * @param {number} count 区块总数
   * @param {boolean} forceFullRepair 是否强制执行完整修复，默认为false
   */
  async checkAccounts (count, forceFullRepair = false) {
    // 如果强制执行完整修复，则直接从头开始修复
    if (forceFullRepair) {
      this.logger.info('Forced full repair requested, rebuilding accounts from genesis block')
      await this.repairAccounts(count, true)
      return
    }

    // 检查是否有账户缺少block_id
    let count2, err2
    try {
      count2 = await this.dao.count('mem_account', {
        where: {
          block_id: {
            // wxm block database
            $eq: null
          }
        }
      })
    } catch (err) {
      err2 = err
    }

    if (err2 || count2 > 0) {
      this.logger.error(err2 || `Encountered ${count2} accounts with missing block_id, looks like node went down during block processing`)

      // 尝试找出最后一个有效的区块高度
      try {
        // 获取最后一个有效的区块高度
        const lastValidBlock = await this.dao.findOne('block', {
          attributes: ['height'],
          order: [['height', 'DESC']]
        })

        if (lastValidBlock) {
          const lastHeight = parseInt(lastValidBlock.height)

          // 获取最后一个有效的账户记录的区块高度
          const lastValidAccountBlock = await this.dao.findOne('mem_account', {
            attributes: ['block_id'],
            where: {
              block_id: {
                $ne: null
              }
            },
            order: [['rowid', 'DESC']]
          })

          if (lastValidAccountBlock && lastValidAccountBlock.block_id) {
            // 查找该区块的高度
            const accountBlock = await this.dao.findOne('block', {
              attributes: ['height'],
              where: {
                id: lastValidAccountBlock.block_id
              }
            })

            if (accountBlock) {
              const accountBlockHeight = parseInt(accountBlock.height)

              // 如果账户记录的区块高度比最后一个有效区块高度小，则从账户记录的区块高度开始修复
              if (accountBlockHeight < lastHeight) {
                this.logger.info(`Last valid account block height: ${accountBlockHeight}, last valid block height: ${lastHeight}`)
                this.logger.info(`Performing incremental repair from height ${accountBlockHeight}`)

                // 从账户记录的区块高度开始修复，不清空账户表
                await this.repairAccounts(count, true, accountBlockHeight, false)
                return
              }
            }
          }
        }
      } catch (findErr) {
        this.logger.error('Error finding last valid block height:', findErr)
      }

      // 如果无法确定最后一个有效的区块高度，则执行完整修复
      this.logger.info('Failed to determine last valid block height, performing full repair')
      await this.repairAccounts(count, true)
      return
    }

    // 检查是否有受托人账户
    let count3, err3
    try {
      count3 = await this.dao.count('mem_account', {
        where: {
          is_delegate: 1 // wxm block database
        }
      })
    } catch (err) {
      err3 = err
    }

    if (err3 || count3 === 0) {
      this.logger.error(err3 || 'No delegates found in accounts, reload database')
      this.logger.info('Failed to verify db integrity: no delegates')

      // 这种情况通常表明账户表完全损坏，需要完整修复
      await this.repairAccounts(count, true)
      return
    }

    // 尝试加载最后一个区块
    try {
      const verify = this.config.loading.verifyOnLoading
      await this.runtime.block.loadBlocksOffset(1, count, verify)
    } catch (err) {
      this.logger.error(err || 'Unable to load last block')
      this.logger.info('Failed to verify db integrity: cannot load last block')

      // 尝试找出最后一个有效的区块高度
      try {
        // 获取最后一个有效的区块高度
        const lastValidBlock = await this.dao.findOne('block', {
          attributes: ['height'],
          where: {
            height: {
              $lt: count.toString() // 查找比当前高度小的最大高度
            }
          },
          order: [['height', 'DESC']]
        })

        if (lastValidBlock) {
          const lastHeight = parseInt(lastValidBlock.height)
          this.logger.info(`Found last valid block at height ${lastHeight}, performing incremental repair`)

          // 从最后一个有效的区块高度开始修复，不清空账户表
          await this.repairAccounts(count, true, lastHeight, false)
          return
        }
      } catch (findErr) {
        this.logger.error('Error finding last valid block height:', findErr)
      }

      // 如果无法确定最后一个有效的区块高度，则执行完整修复
      await this.repairAccounts(count, true)
      return
    }

    // 如果所有检查都通过，只需要更新账户余额缓存
    await this.cacheAllAccountBalances()
    this.logger.info('Account integrity check passed, blockchain ready')
  }

  /**
   * 合并账户信息
   * @param {*} address 账号公钥地址，可以为空，这时候变化的内容（diff）里提供公钥也是可以的
   * @param {object} diff 变化内容(变更的publicKey 或 balance)
   * @param {object} dbTrans 交易
   */
  async merge (address, diff, dbTrans) {
    const update = {}
    const remove = {}
    const insert = {}
    const insert_object = {}
    const remove_object = {}

    // 添加参数验证
    if (!address && !diff.publicKey) {
        throw new Error('Missing address or publicKey parameter');
    }

    if (!address && diff.publicKey) {
        address = this.generateAddressByPublicKey(diff.publicKey) // wxm block database
    }

    // 把余额添加到缓存（map)
    if (typeof diff.balance === 'string') {
        // 添加余额验证
        const balance = DdnUtils.bignum.new(diff.balance);
        if (DdnUtils.bignum.isNaN(balance)) {
            throw new Error(`Invalid balance value: ${diff.balance} for address: ${address}`);
        }
        diff.balance = balance;
        this.balanceCache.addNativeBalance(address, diff.balance)
    }

    try {
        for (const value of this._editable) {
            const trueValue = diff[value]
            if (!trueValue) {
                continue
            }

            switch (this._fieldTypes[value]) {
                case String:
                    update[value] = trueValue
                    break
                case Number:
                    // 增加数值验证
                    if (DdnUtils.bignum.isNaN(DdnUtils.bignum.new(trueValue))) {
                        throw new Error(
                            `Invalid number while merging account: ${trueValue}, value: ${value}, address: ${address}`
                        )
                    }
                    // trueValue 为正数并且不等0
                    if (
                        DdnUtils.bignum.isEqualTo(DdnUtils.bignum.abs(trueValue), trueValue) &&
                        !DdnUtils.bignum.isZero(trueValue)
                    ) {
                        update[value] = this.dao.db_str(`${value} + ${DdnUtils.bignum.new(trueValue)}`)
                    } else if (DdnUtils.bignum.isLessThan(trueValue, 0)) {
                        update[value] = this.dao.db_str(`${value} ${DdnUtils.bignum.new(trueValue)}`)
                    }
                    // 字段为balance并且不等于0
                    if (!DdnUtils.bignum.isZero(trueValue) && value === 'balance') {
                        const mem_accounts2delegate = await this.dao.findOne('mem_accounts2delegate', {
                            where: {
                                account_id: address // wxm block database
                            },
                            transaction: dbTrans
                        })

                        if (mem_accounts2delegate && diff.block_id !== this.genesisblock.id) {
                            // wxm async ok      genesisblock.block.id
                            await this.dao.insert(
                                'mem_round',
                                {
                                    address: address,
                                    amount: trueValue.toString(),
                                    delegate: mem_accounts2delegate.dependent_id, // wxm block database
                                    block_id: diff.block_id, // wxm block database
                                    round: diff.round.toString()
                                },
                                {
                                    transaction: dbTrans
                                }
                            )
                        }
                    }
                    break
                case Array:
                    // ... 保持原有Array处理逻辑不变
                    if (Object.prototype.toString.call(trueValue[0]) === '[object Object]') {
                        for (let i = 0; i < trueValue.length; i++) {
                            const val = trueValue[i]
                            if (val.action === '-') {
                                delete val.action
                                remove_object[value] = remove_object[value] || []
                                remove_object[value].push(val)
                            } else if (val.action === '+') {
                                delete val.action
                                insert_object[value] = insert_object[value] || []
                                insert_object[value].push(val)
                            } else {
                                delete val.action
                                insert_object[value] = insert_object[value] || []
                                insert_object[value].push(val)
                            }
                        }
                    } else {
                        // ... 保持原有数组元素处理逻辑不变
                        for (let i = 0; i < trueValue.length; i++) {
                            const math = trueValue[i][0]
                            let val = null
                            if (math === '-') {
                                val = trueValue[i].slice(1)
                                remove[value] = remove[value] || []
                                remove[value].push(val)
                            } else if (math === '+') {
                                val = trueValue[i].slice(1)
                                insert[value] = insert[value] || []
                                insert[value].push(val)
                            } else {
                                val = trueValue[i]
                                insert[value] = insert[value] || []
                                insert[value].push(val)
                            }
                            if (value === 'delegates') {
                                const balanceField = 'balance'
                                const mem_account = await this.dao.findOne('mem_account', {
                                    where: {
                                        address
                                    },
                                    transaction: dbTrans
                                })

                                if (mem_account) {
                                    await this.dao.insert(
                                        'mem_round',
                                        {
                                            address: address,
                                            amount: (math || '+') + mem_account[balanceField].toString(),
                                            delegate: val,
                                            block_id: diff.block_id,
                                            round: diff.round.toString()
                                        },
                                        {
                                            transaction: dbTrans
                                        }
                                    )
                                }
                            }
                        }
                    }
                    break
            }
        }

        // ... 保持原有的数据库操作逻辑不变
        const removeKeys = Object.keys(remove)
        for (const el of removeKeys) {
            await this.dao.remove('mem_accounts2' + el.substring(0, el.length - 1), {
                where: {
                    dependent_id: {
                        $in: remove[el]
                    },
                    account_id: address
                },
                transaction: dbTrans
            })
        }

        const insertKeys = Object.keys(insert)
        for (const el of insertKeys) {
            for (let i = 0; i < insert[el].length; i++) {
                await this.dao.insert(
                    'mem_accounts2' + el.substring(0, el.length - 1),
                    {
                        account_id: address,
                        dependent_id: insert[el][i]
                    },
                    {
                        transaction: dbTrans
                    }
                )
            }
        }

        const removeObjectKeys = Object.keys(remove_object)
        for (const el of removeObjectKeys) {
            await this.dao.remove('mem_accounts2' + el.substring(0, el.length - 1), {
                where: remove_object[el],
                transaction: dbTrans
            })
        }

        const insertObjectKeys = Object.keys(insert_object)
        for (const el of insertObjectKeys) {
            for (let i = 0; i < insert[el].length; i++) {
                await this.dao.insert('mem_accounts2' + el.substring(0, el.length - 1), insert_object[el], {
                    transaction: dbTrans
                })
            }
        }

        const updateKeys = Object.keys(update)
        if (updateKeys.length) {
            await this.dao.update('mem_account', update, {
                where: {
                    address
                },
                transaction: dbTrans
            })
        }

        return await this.getAccountByAddress(address)
    } catch (err) {
        this.logger.error('!!!!!!! merge error:', {
            message: err.message,
            address,
            diff,
            stack: err.stack
        });
        throw err;
    }
  }

  async updateAccount (data, where, dbTrans) {
    return await this.dao.update('mem_account', data, { where, transaction: dbTrans })
  }

  async getAccountBalance(address) {
    const account = await this.getAccountByAddress(address);
    return account ? account.balance : 0;
  }
}

export default Account
