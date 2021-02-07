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

  async getAccount (where, attributes, dbTrans) {
    const address = (where || {}).address
    if (typeof address === 'string' && !this.isAddress(address)) {
      this.logger.error('account address', address)
      throw new Error('Invalid address getAccount')
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

  // 重建账户和余额信息（根据已有区块信息）
  async repairAccounts (count, verify) {
    if (typeof count === 'undefined') {
      count = await this.runtime.block.getCount()
    }

    await this.dao.clear('mem_account', true)
    await this.dao.clear('mem_round', true)
    await this.dao.clear('mem_accounts2u_delegate', true)

    const sql = 'INSERT INTO mem_accounts2u_delegates SELECT * FROM mem_accounts2delegates;'
    await this.dao.execSql(sql)

    let offset = 0
    const limit = Number(this.config.loading.loadPerIteration) || 1000
    verify = verify || this.config.loading.verifyOnLoading

    try {
      this.runtime.block.setLastBlock(null)

      while (count >= offset) {
        if (count > 1) {
          this.logger.info(`Rebuilding blockchain, current block height:${offset}`)
        }

        await this.runtime.block.loadBlocksOffset(limit, offset, verify)
        offset += limit
      }

      await this.cacheAllAccountBalances()

      this.logger.info('repairAccounts is ok, Blockchain ready')
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

  // 检查钱包账户数据完整性
  async checkAccounts (count) {
    // try {
    //   const result = await this.dao.update(
    //     'mem_account',
    //     {
    //       u_is_delegate: this.dao.db_str('is_delegate'), // wxm block database
    //       u_second_signature: this.dao.db_str('second_signature'), // wxm block database
    //       u_username: this.dao.db_str('username'),
    //       u_balance: this.dao.db_str('balance'),
    //       u_delegates: this.dao.db_str('delegates'),
    //       u_multisignatures: this.dao.db_str('multisignatures')
    //     },
    //     {
    //       where: {}
    //     }
    //   )
    //   this.logger.debug('checkAccounts result', result)
    // } catch (err) {
    //   this.logger.error(err)
    //   this.logger.info('Failed to verify db integrity 1')
    //   await this.repairAccounts(count, true)
    //   return
    // }

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
      this.logger.error(err2 || 'Encountered missing block, looks like node went down during block processing')
      this.logger.info('Failed to verify db integrity 2')

      await this.repairAccounts(count, true)
      return
    }

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
      this.logger.error(err3 || 'No delegates, reload database')
      this.logger.info('Failed to verify db integrity 3')

      await this.repairAccounts(count, true)
      return
    }

    try {
      const verify = this.config.loading.verifyOnLoading
      await this.runtime.block.loadBlocksOffset(1, count, verify)
    } catch (err) {
      this.logger.error(err || 'Unable to load last block')
      this.logger.info('Failed to verify db integrity 4')

      await this.repairAccounts(count, true)
    }

    // wxm TODO  此处旧代码是直接cacheAllAccountBalances，但是如果block区块内容改动过，是不会发现的，感觉还是应该repaireAccounts，但是repaireAccounts每次重启会重新遍历区块数据，数据太大会导致启动消耗很多时间
    // await this.repairAccounts(count, true)
    await this.cacheAllAccountBalances()

    this.logger.info('checkAccounts is ok, Blockchain ready')
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

    if (!address && diff.publicKey) {
      address = this.generateAddressByPublicKey(diff.publicKey) // wxm block database
    }
    // 把余额添加到缓存（map)
    if (diff.balance) {
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
            if (DdnUtils.bignum.isNaN(trueValue)) {
              throw new Error(
                'Encountered invalid number while merging account: ' +
                  trueValue +
                  ', value: ' +
                  value +
                  ', address: ' +
                  address
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
                  // if (math === '-') {
                  //   balanceField = '-balance';
                  // }
                  const mem_account = await this.dao.findOne('mem_account', {
                    where: {
                      address
                    },
                    transaction: dbTrans
                  })

                  // this.logger.debug('FindOne account when merge, it is ', mem_account)

                  if (mem_account) {
                    await this.dao.insert(
                      'mem_round',
                      {
                        address: address,
                        amount: (math || '+') + mem_account[balanceField].toString(),
                        delegate: val,
                        block_id: diff.block_id, // wxm block database
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

      const removeKeys = Object.keys(remove)
      for (const el of removeKeys) {
        await this.dao.remove('mem_accounts2' + el.substring(0, el.length - 1), {
          where: {
            dependent_id: {
              // wxm block database
              $in: remove[el]
            },
            account_id: address // wxm block database
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
              account_id: address, // wxm block database
              dependent_id: insert[el][i] // wxm block database
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
      this.logger.error('!!!!!!! merge sql error: ' + err)
      throw err
    }
  }

  async updateAccount (data, where, dbTrans) {
    return await this.dao.update('mem_account', data, { where, transaction: dbTrans })
  }
}

export default Account
