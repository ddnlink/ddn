/**
 * 区块数据核心处理逻辑和方法
 * wangxm   2018-12-27
 */
const addressUtil = require('../../lib/address');
const bluebird = require('bluebird')
const bignum = require('@ddn/bignum-utils'); //bignum update

var _singleton;

class Account {
    static singleton(context) {
        if (!_singleton) {
            _singleton = new Account(context);
        }
        return _singleton;
    }

    constructor(context) {
        // context.runtime.account = this;

        Object.assign(this, context);
        this._context = context;

        this._fieldTypes = {
            username: String,
            is_delegate: Boolean,
            u_is_delegate: Boolean,
            second_signature: Boolean,
            u_second_signature: Boolean,
            u_username: String,
            address: String,
            public_key: String,
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
        };

        this._editable = [
            "is_delegate", //wxm block database
            "u_is_delegate",   //wxm block database
            "second_signature",    //wxm block database
            "u_second_signature",  //wxm block database
            "balance",
            "u_balance",
            "vote",
            "rate",
            "delegates",
            "u_delegates",
            "multisignatures",
            "u_multisignatures",
            "multimin",
            "u_multimin",
            "multilifetime",
            "u_multilifetime",
            "block_id",    //wxm block database
            "nameexist",
            "u_nameexist",
            "producedblocks",
            "missedblocks",
            "fees",
            "rewards",
            "lock_height" //wxm block database
        ];
    }

    async initAccountsAndBalances() {
        let verify = this.config.loading.verifyOnLoading;
        var count = await this.runtime.block.getCount();
        if (verify || count == 1) {
            await this.repairAccounts(count, true);
        } else {
            await this.checkAccounts(count);
        }

        return true;
    }

    isAddress(address) {
        return addressUtil.isAddress(address);
    }

    /**
     * 根据公钥生成钱包地址
     * @param {*} publicKey 
     */
    generateAddressByPublicKey(publicKey) {
        return addressUtil.generateBase58CheckAddress(publicKey);
    }

    /**
     * 设置账户信息（有则修改，没有则新增）
     * @param {*} data 账户信息，address或public_key必有其一
     * @param {*} dbTrans 
     */
    async setAccount(data, dbTrans) {
		let address = data.address || null;
		if (address === null) {
			if (data.public_key) {  //wxm block database
				address = this.generateAddressByPublicKey(data.public_key);  //wxm block database
				delete data.isGenesis;
			} else {
                this.logger.debug('setAccount error and data is:', data);
                throw new Error("Missing address or public key in setAccount");
			}
		}
		if (!address) {
            throw new Error("Invalid public key");
        }
        data.address = address;

        return new Promise((resolve, reject) => {
            this.dao.insertOrUpdate("mem_account", data, dbTrans, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        })
    }

    async getAccountByAddress(address) {
        return await this.getAccount({address});
    }

    async getAccountByPublicKey(publicKey) {
        var address = this.generateAddressByPublicKey(publicKey);
        var result = await this.getAccount({address});
        if (result && !result.public_key) {
            result.public_key = publicKey;
        }
        return result;
    }

    async getAccount(filter, fields) {
        const list = await this.getAccountList(filter, fields);
        if (list && list.length > 0) {
            return list[0];
        }
        return null;
    }

    async getAccountList(filter, fields) {
        // if (typeof (fields) == 'undefined' || fields == null) {
        //     fields = this.fields.map(function (field) {
        //       return field.alias || field.field;
        //     });
        // }
        
        // var realFields = this.fields.filter(function (field) {
        //     return fields.indexOf(field.alias || field.field) != -1;
        // });
        
        // var realConv = {};
        // Object.keys(this.conv).forEach(function (key) {
        //     if (fields.indexOf(key) != -1) {
        //       realConv[key] = this.conv[key];
        //     }
        // }.bind(this));
        
        var limit, offset, sort;
        
        if (filter.limit > 0) {
            limit = filter.limit;
        }
        delete filter.limit;
        if (filter.offset > 0) {
            offset = filter.offset;
        }
        delete filter.offset;
        if (filter.sort) {
            sort = filter.sort;
        }
        delete filter.sort;

        if (typeof(filter.address) == "string" && !this.isAddress(filter.address)) {
            throw new Error('Invalid address getAccount');
        }
        
        // const newFields = realFields.map(({
        //     field
        // }) => field)
        
        // shuai 2019-11-20
        return new Promise(async (resolve, reject) => {
            try {
                let mem_accounts = await new Promise((reslove, reject) => {
                    this.dao.findPage('mem_account', filter, limit || 1000, offset, false, fields || null, sort, (err, data) => {
                        if (err) {
                            return reject(err);
                        }
                        reslove(data)
                    })
                })
                const mem_account_ids = mem_accounts.map(({ address }) => address)
                let delegates = [], u_delegates = [], multisignatures = [], u_multisignatures = []
                if (mem_account_ids.length > 0) {
                    delegates = await new Promise((reslove, reject) => {
                        this.dao.findListByGroup('mem_accounts2delegate', {
                        account_id: { '$in': mem_account_ids }   //wxm block database
                        }, {
                            limit: mem_account_ids.length,
                            offset: 0,
                            group: ['account_id'],
                            attributes: [[this.dao.db_fnGroupConcat('dependent_id') , 'delegates'], 'account_id']
                        }, (err, data) => {//wxm block database library.dao.db_fn('group_concat', library.dao.db_col('dependentId'))
                            if (err) {
                                return reject(err);
                            }
                            reslove(data)
                        })
                    })
                    u_delegates = await new Promise((reslove, reject) => {
                        this.dao.findListByGroup('mem_accounts2u_delegate', {
                            account_id: {    //wxm block database
                                '$in': mem_account_ids
                            }
                        }, {
                            limit: mem_account_ids.length,
                            offset: 0,
                            group: ['account_id'],
                            attributes: [[this.dao.db_fnGroupConcat('dependent_id'), 'u_delegates'], 'account_id']    //wxm block database library.dao.db_fn('group_concat', library.dao.db_col('dependentId'))
                        }, (err, data) => {
                            if (err) {
                                return reject(err);
                            }
                            reslove(data)
                        })
                    })
                    multisignatures = await new Promise((reslove, reject) => {
                        this.dao.findListByGroup('mem_accounts2multisignature', {
                            account_id: {    //wxm block database
                                '$in': mem_account_ids
                            }
                        }, {
                            limit: mem_account_ids.length,
                            offset: 0,
                            group: ['account_id'],
                            attributes: [
                                [this.dao.db_fnGroupConcat('dependent_id'), 'multisignatures'], 'account_id'    //wxm block database library.dao.db_fn('group_concat', library.dao.db_col('dependentId'))
                        ]}, (err, data) => {
                            if (err) {
                                return reject(err);
                            }
                            reslove(data)
                        })
                    })
                    u_multisignatures = await new Promise((reslove, reject) => {
                        this.dao.findListByGroup('mem_accounts2u_multisignature', {
                            account_id: {    //wxm block database
                                '$in': mem_account_ids
                            }
                        }, {
                            limit: mem_account_ids.length,
                            offset: 0,
                            group: ['account_id'],
                            attributes: [
                                [this.dao.db_fnGroupConcat('dependent_id'), 'u_multisignatures'], 'account_id'   //wxm block database library.dao.db_fn('group_concat', library.dao.db_col('dependentId'))
                        ]}, (err, data) => {
                            if (err) {
                                return reject(err);
                            }
                            reslove(data)
                        })
                    })
                }
        
                mem_accounts = mem_accounts.map((mem_account) => {
                    const delegates_item = delegates.find(({
                        account_id,    //wxm block database
                        delegates
                    }) => account_id === mem_account.address && delegates)  //wxm block database
                    const u_delegates_item = u_delegates.find(({
                        account_id,    //wxm block database
                        u_delegates
                    }) => account_id === mem_account.address && u_delegates)    //wxm block database
                    const multisignatures_item = multisignatures.find(({
                        account_id,    //wxm block database
                        multisignatures
                    }) => account_id === mem_account.address && multisignatures)    //wxm block database
                    const u_multisignatures_item = u_multisignatures.find(({
                        account_id,    //wxm block database
                        u_multisignatures
                    }) => account_id === mem_account.address && u_multisignatures)  //wxm block database

                    const result2 = Object.assign({}, mem_account, {
                        delegates: delegates_item ? delegates_item.delegates.split(',') : [],
                        u_delegates: u_delegates_item ? u_delegates_item.u_delegates.split(',') : [],
                        multisignatures: multisignatures_item ? multisignatures_item.multisignatures.split(',') : [],
                        u_multisignatures: u_multisignatures_item ? u_multisignatures_item.u_multisignatures.split(',') : [],
                    });
                    return result2;
                })

                resolve(mem_accounts);
            } catch (e) {
                reject(e);
            }
        })
    }

    async cacheAllAccountBalances() {
        var getAccountList = async (limit, offset) => {
            return new Promise((resolve, reject) => {
                this.dao.findPage('mem_account', null, limit, offset, false, ['address', 'balance'], null, (err, result) => {
                    if (err)
                    {
                        reject(`Failed to load native balances: ${err}`);
                    }
                    else
                    {
                        resolve(result);
                    }
                });
            })
        };

        var pageSize = 5000;
        var pageIndex = 0;

        while (true)
        {
            var list = await getAccountList(pageSize, pageIndex * pageSize);

            if (list && list.length > 0) 
            {
                for (var i = 0; i < list.length; i++)
                {
                    let { address, balance } = list[i];
                    this.balanceCache.setNativeBalance(address, balance);
                }
                this.balanceCache.commit();

                if (list.length < pageSize)
                {
                    break;
                }
            }
            else
            {
                break;
            }
        }
    }

    //重建账户和余额信息（根据已有区块信息）
    async repairAccounts(count, verify) {
        if (typeof(count) == "undefined") {
            count = await this.runtime.block.getCount();
        }

        return new Promise((resolve, reject) => {
            this.dao.clear("mem_account", true, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    this.dao.clear("mem_round", true, (err2, result2) => {
                        if (err2) {
                            reject(err2);
                        } else {
                            this.dao.clear("mem_accounts2u_delegate", true, (err3, result3) => {
                                if (err3) {
                                    reject(err3)
                                } else {
                                    var sql = "INSERT INTO mem_accounts2u_delegates SELECT * FROM mem_accounts2delegates;";
                                    this.dao.execSql(sql, async (err4, result4) => {
                                        if (err4) {
                                            reject(err4);
                                        } else {
                                            let offset = 0;
                                            let limit = Number(this.config.loading.loadPerIteration) || 1000;
                                            verify = verify || this.config.loading.verifyOnLoading;

                                            try {
                                                this.runtime.block.setLastBlock(null);

                                                while (count >= offset) {
                                                    if (count > 1) {
                                                        this.logger.info(`Rebuilding blockchain, current block height:${offset}`);
                                                    }

                                                    await this.runtime.block.loadBlocksOffset(limit, offset, verify);
                                                    offset += limit;
                                                }

                                                await this.cacheAllAccountBalances();
        
                                                this.logger.info('Blockchain ready');

                                                resolve();
                                            } catch (err5) {
                                                this.logger.error('loadBlocksOffset', err5);

                                                //wxm TODO 此处的block属性不知道哪里赋值的，待确认
                                                if (err5 && err5.block)
                                                {
                                                    try
                                                    {
                                                        this.logger.error('Blockchain failed at ', err5.block.height);

                                                        await this.runtime.block.simpleDeleteAfterBlock(err5.block.height);

                                                        this.logger.error('Blockchain clipped');

                                                        await this.cacheAllAccountBalances();

                                                        resolve();
                                                    }
                                                    catch (err6)
                                                    {
                                                        reject(err6); 
                                                    }
                                                }
                                                else
                                                {
                                                    reject(err5);
                                                }
                                            }
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        })
    }

    //检查钱包账户数据完整性
    async checkAccounts(count) {
        return new Promise((resolve, reject) => {
            this.dao.update('mem_account', {
                u_is_delegate: this.dao.db_str("is_delegate"),//wxm block database
                u_second_signature: this.dao.db_str("second_signature"),//wxm block database
                u_username: this.dao.db_str("username"),
                u_balance: this.dao.db_str("balance"),
                u_delegates: this.dao.db_str("delegates"),
                u_multisignatures: this.dao.db_str("multisignatures")
            }, {}, async (err, result) => {
                if (err) {
                    this.logger.error(err);
                    this.logger.info("Failed to verify db integrity 1");

                    try
                    {
                        await this.repairAccounts(count, true);
                        resolve();
                    }
                    catch (e)
                    {
                        return reject(e);
                    }
                } else {
                    this.dao.count('mem_account', {
                        block_id: {  //wxm block database
                            "$eq": null
                        }
                    }, async (err2, count2) => {
                        if (err2 || count2 > 0) {
                            this.logger.error(err || "Encountered missing block, looks like node went down during block processing");
                            this.logger.info("Failed to verify db integrity 2");

                            try
                            {
                                await this.repairAccounts(count, true);
                                resolve();
                            }
                            catch (e)
                            {
                                return reject(e);
                            }
                        } else {
                            this.dao.count('mem_account', {
                                is_delegate: 1   //wxm block database
                            }, async (err3, count3) => {
                                if (err3 || count3 == 0) {
                                    this.logger.error(err || "No delegates, reload database");
                                    this.logger.info("Failed to verify db integrity 3");

                                    try
                                    {
                                        await this.repairAccounts(count, true);
                                        resolve();
                                    }
                                    catch(e)
                                    {
                                        return reject(e);
                                    }
                                } else {
                                    var errCatched = false;
                                    
                                    try
                                    {
                                        let verify = this.config.loading.verifyOnLoading;
                                        await this.runtime.block.loadBlocksOffset(1, count, verify);
                                    }
                                    catch (err4) 
                                    {
                                        errCatched = true;

                                        this.logger.error(err || "Unable to load last block");
                                        this.logger.info("Failed to verify db integrity 4");

                                        try
                                        {
                                            await this.repairAccounts(count, true);
                                        }
                                        catch(e)
                                        {
                                            return reject(e);
                                        }
                                    }

                                    if (!errCatched) {
                                        try
                                        {
                                            //wxm TODO  此处旧代码是直接cacheAllAccountBalances，但是如果block区块内容改动过，是不会发现的，感觉还是应该repaireAccounts，但是repaireAccounts每次重启会重新遍历区块数据，数据太大会导致启动消耗很多时间
                                            // await this.repairAccounts(count, true);
                                            await this.cacheAllAccountBalances();
                                        }
                                        catch(e)
                                        {
                                            return reject(e);
                                        }

                                        this.logger.info('Blockchain ready');
                                    }

                                    resolve();
                                }
                            });
                        }
                    });
                }
            });
        })
    }

    async merge(address, diff, dbTrans) {
        var update = {};
        var remove = {};
        var insert = {};
        var insert_object = {};
        var remove_object = {};
        var round = [];

        if (!address && diff.public_key) {
            address = this.generateAddressByPublicKey(diff.public_key);   //wxm block database
        }

        if (diff['balance']) {
            this.balanceCache.addNativeBalance(address, diff['balance'])
        }

        // shuai 2018-11-22
        return new Promise(async (resolve, reject) => {
            try {
                await bluebird.each(this._editable, async (value) => {
                    const trueValue = diff[value];
                    if (!trueValue) {
                        return
                    }

                    switch (this._fieldTypes[value]) {
                        case String:
                            update[value] = trueValue;
                            break;
                        case Number:
                            //bignum update   if (isNaN(trueValue) || trueValue === Infinity) {
                            if (bignum.isNaN(trueValue)) {
                                return reject("Encountered invalid number while merging account: " + trueValue + ", value: " + value + ", value: " + address);
                            }

                            //bignum update   if (Math.abs(trueValue) === trueValue && trueValue !== 0) {
                            if (bignum.isEqualTo(bignum.abs(trueValue), trueValue) && !bignum.isZero(trueValue)) {
                                // update.$inc = update.$inc || {};
                                // //bignum update update.$inc[value] = trueValue;
                                // update.$inc[value] = bignum.new(trueValue).toString();
                                update[value] = this.dao.db_str(`${value} + ${bignum.new(trueValue)}`)
                            //bignum update   } else if (trueValue < 0) {
                            } else if (bignum.isLessThan(trueValue, 0)) {
                                // update.$dec = update.$dec || {};
                                // //bignum update update.$dec[value] = Math.abs(trueValue);
                                // update.$dec[value] = bignum.abs(trueValue).toString();
                                
                                update[value] = this.dao.db_str(`${value} ${bignum.new(trueValue)}`)   
                            }

                            //bignum update   if (trueValue !== 0 && value == "balance") {
                            if (!bignum.isZero(trueValue) && value == "balance") {
                                const mem_accounts2delegate = await new Promise((resolve, reject) => {
                                    this.dao.findOne('mem_accounts2delegate', {
                                        account_id: address    //wxm block database
                                    }, null, dbTrans, (err, data) => {
                                        if (err) {
                                            return reject(err)
                                        }
                                        resolve(data)
                                    })
                                })

                                if (mem_accounts2delegate) {
                                    await new Promise((resolve, reject) => {
                                        this.dao.insert('mem_round', {
                                            address: address,
                                            amount: trueValue.toString(),
                                            delegate: mem_accounts2delegate.dependent_id,    //wxm block database
                                            block_id: diff.block_id,  //wxm block database
                                            round: diff.round.toString(),
                                        }, dbTrans, (err) => {
                                            if (err) {
                                                return reject(err)
                                            }
                                            return resolve()
                                        })
                                    })
                                }
                            }
                            
                            break;
                        case Array:
                            if (Object.prototype.toString.call(trueValue[0]) == "[object Object]") {
                                for (var i = 0; i < trueValue.length; i++) {
                                    var val = trueValue[i];
                                    if (val.action == "-") {
                                        delete val.action;
                                        remove_object[value] = remove_object[value] || [];
                                        remove_object[value].push(val);
                                    } else if (val.action == "+") {
                                        delete val.action;
                                        insert_object[value] = insert_object[value] || [];
                                        insert_object[value].push(val)
                                    } else {
                                        delete val.action;
                                        insert_object[value] = insert_object[value] || [];
                                        insert_object[value].push(val)
                                    }
                                }
                            } else {
                                for (var i = 0; i < trueValue.length; i++) {
                                    var math = trueValue[i][0];
                                    var val = null;
                                    if (math == "-") {
                                        val = trueValue[i].slice(1);
                                        remove[value] = remove[value] || [];
                                        remove[value].push(val);
                                    } else if (math == "+") {
                                        val = trueValue[i].slice(1);
                                        insert[value] = insert[value] || [];
                                        insert[value].push(val)
                                    } else {
                                        val = trueValue[i];
                                        insert[value] = insert[value] || [];
                                        insert[value].push(val)
                                    }
                                    if (value == "delegates") {
                                        var balanceField = 'balance';
                                        // if (math == '-') {
                                        //   balanceField = '-balance';
                                        // }
                                        const mem_account = await new Promise((resolve, reject) => {
                                            this.dao.findOne('mem_account', {
                                                address
                                            }, null, dbTrans, (err, data) => {
                                                if (err) {
                                                    return reject(err)
                                                }
                                                resolve(data)
                                            })
                                        })

                                        if (mem_account) {
                                            var a = {
                                                address: address,
                                                amount: math + mem_account[balanceField].toString(),
                                                delegate: val,
                                                block_id: diff.block_id,    //wxm block database
                                                round: diff.round.toString(),
                                            };
        
                                            await new Promise((resolve, reject) => {
                                                this.dao.insert('mem_round', {
                                                    address: address,
                                                    amount: math + mem_account[balanceField].toString(),
                                                    delegate: val,
                                                    block_id: diff.block_id,    //wxm block database
                                                    round: diff.round.toString(),
                                                }, dbTrans, (err) => {
                                                    if (err) {
                                                        return reject(err)
                                                    }
                                                    return resolve()
                                                })
                                            })
                                        }
                                    }
                                }
                            }
                            
                            break;
                    }
                })

                const removeKeys = Object.keys(remove);
                await bluebird.each(removeKeys, async (el) => {
                    await new Promise((resolve, reject) => {
                        this.dao.remove("mem_accounts2" + el.substring(0, el.length - 1), {
                            dependent_id: {  //wxm block database
                                $in: remove[el]
                            },
                            account_id: address  //wxm block database
                        }, dbTrans, (err) => {
                            if (err) {
                                return reject(err)
                            }
                            resolve()
                        })
                    })
                })

                const insertKeys = Object.keys(insert)
                await bluebird.each(insertKeys, async (el) => {
                    await bluebird.each(insert[el], async (_, i) => {
                        await new Promise((resolve, reject) => {
                            this.dao.insert("mem_accounts2" + el.substring(0, el.length - 1), {
                                account_id: address,   //wxm block database
                                dependent_id: insert[el][i]    //wxm block database
                            }, dbTrans, (err) => {
                                if (err) {
                                    return reject(err)
                                }
                                resolve()
                            })
                        })
                    })
                })

                const removeObjectKeys = Object.keys(remove_object)
                await bluebird.each(removeObjectKeys, async (el) => {
                    await new Promise((resolve, reject) => {
                        this.dao.remove("mem_accounts2" + el.substring(0, el.length - 1), remove_object[el], dbTrans, (err) => {
                            if (err) {
                                return reject(err)
                            }
                            resolve()
                        })
                    })
                })

                const insertObjectKeys = Object.keys(insert_object)
                await bluebird.each(insertObjectKeys, async (el) => {
                    await bluebird.each(insert[el], async () => {
                        await new Promise((resolve, reject) => {
                            this.dao.insert("mem_accounts2" + el.substring(0, el.length - 1), insert_object[el], dbTrans, (err) => {
                                if (err) {
                                    return reject(err)
                                }
                                resolve()
                            })
                        })
                    })
                })

                const updateKeys = Object.keys(update)
                if (updateKeys.length) {
                    await new Promise((resolve, reject) => {
                        this.dao.update('mem_account', update, {
                            address
                        }, dbTrans, (err) => {
                            if (err) {
                                return reject(err)
                            }
                            resolve()
                        })
                    })
                }

                var accountInfo = await this.getAccountByAddress(address);
                resolve(accountInfo);
            } catch (err) {
                console.log('!!!!!!! merge sql error: ' + err);
                reject(err);
            }
        })
    }

    async updateAccount(data, where, dbTrans) {
        return new Promise((resolve, reject) => {
            this.dao.update('mem_account', data, where, dbTrans, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }
}

module.exports = Account;