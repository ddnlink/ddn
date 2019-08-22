/**
 * Delegate
 * wangxm   2018-01-08
 */
const crypto = require('crypto');
const util = require('util');
const ed = require('ed25519');
const bignum = require('@ddn/bignum-utils');

var _singleton;

class Delegate {

    static singleton(context) {
        if (!_singleton) {
            _singleton = new Delegate(context);
        }
        return _singleton;
    }

    constructor(context) {
        Object.assign(this, context);
        this._context = context;

        this._myDelegateKeypairs = {};
        this._myDelegateNum = 0;

        this._forgingEanbled = true;
    }

    /**
     * 当前节点是否允许区块铸造
     */
    isForgeEnabled() {
        return this._forgingEanbled;
    }

    /**
     * 判断当前节点是否配置有有效受托人信息
     */
    hasValidDelegates() {
        return this._myDelegateNum > 0;
    }

    async enableForged(keypair) {
        this._myDelegateKeypairs[keypair.publicKey.toString('hex')] = keypair;
    }

    async disableForgedByPublicKey(publicKey) {
        delete this._myDelegateKeypairs[publicKey];
    }

    async getMyDelegateByPublicKey(publicKey) {
        return this._myDelegateKeypairs[publicKey];
    }

    async prepare() {
        let secrets = null;
        if (this.config.forging.secret) {
            secrets = util.isArray(this.config.forging.secret) ? this.config.forging.secret : [this.config.forging.secret];
        }

        var delegateKeypairs = {};
        var delegatePublicKeys = [];
        for (var i = 0; i < secrets.length; i++) {
            const keypair = ed.MakeKeypair(crypto.createHash('sha256').update(secrets[i], 'utf8').digest());
            delegateKeypairs[keypair.publicKey.toString('hex')] = keypair;
            delegatePublicKeys.push(keypair.publicKey.toString('hex'));
        }
  
        var accounts = await this.runtime.account.getAccountList({
            public_key: { //wxm block database
                "$in": delegatePublicKeys
            },
            limit: delegatePublicKeys.length
        });
        if (accounts && accounts.length == delegatePublicKeys.length) {
            for (var i = 0; i < accounts.length; i++) {
                var account = accounts[i];
                if (account.is_delegate) {
                    this._myDelegateKeypairs[account.public_key] = delegateKeypairs[account.public_key]; //wxm block database
                    this._myDelegateNum++;
                    this.logger.info(`Forging enabled on account: ${account.address}`);
                } else {
                    this.logger.info(`Delegate with this public key not found: ${account.public_key}`);   //wxm block database
                }
            }
        } else {
            throw new Error("Delegates not found.");
        }
    }

    async checkDelegates(publicKey, votes) {
        if (util.isArray(votes)) {
            var account = await this.runtime.account.getAccountByPublicKey(publicKey);
            if (!account) {
                throw new Error("Account not found");
            }

            const existing_votes = account.delegates ? account.delegates.length : 0;
            let additions = 0, removals = 0;

            for (var i = 0; i < votes.length; i++) {
                var action = votes[i];
                
                var math = action[0];
                if (math !== '+' && math !== '-') {
                    throw new Error("Invalid math operator");
                }

                if (math == '+') {
                    additions += 1;
                } else if (math == '-') {
                    removals += 1;
                }

                var publicKey2 = action.slice(1);
                try {
                    new Buffer(publicKey2, "hex");
                } catch (e) {
                    throw new Error("Invalid public key");
                }

                if (math == "+" && (account.delegates !== null && account.delegates.indexOf(publicKey2) != -1)) {
                    throw new Error("Failed to add vote, account has already voted for this delegate");
                }
                if (math == "-" && (account.delegates === null || account.delegates.indexOf(publicKey2) === -1)) {
                    throw new Error("Failed to remove vote, account has not voted for this delegate");
                }

                var account2 = await this.runtime.account.getAccount({
                    public_key: publicKey2,
                    is_delegate: 1
                });
                if (!account2) {
                    throw new Error("Delegate not found");
                }
            }

            var total_votes = (existing_votes + additions) - removals;
            if (total_votes > this.config.settings.delegateNumber) {
                var exceeded = total_votes - this.config.settings.delegateNumber;
                throw new Error(`Maximum number ${this.config.settings.delegateNumber} votes exceeded (${exceeded} too many).`);
            }
        } else {
            throw new Error("Please provide an array of votes");
        }
    }

    async getDelegates(query) {
        if (!query) {
            throw "Missing query argument";
        }
        
        var delegates = await this.runtime.account.getAccountList({
            is_delegate: 1,  //wxm block database
            // sort: {"vote": -1, "publicKey": 1},
            sort: [['vote', 'DESC'], ['public_key', 'ASC']] //wxm block database
        }, ["username", "address", "public_key", "vote", "missedblocks", "producedblocks", "fees", "rewards", "balance"]);

        var limit = query.limit || this.config.settings.delegateNumber;
		var offset = query.offset || 0;
		var orderField = query.orderBy || 'rate:asc';

        orderField = orderField ? orderField.split(':') : null;
        limit = limit > this.config.settings.delegateNumber ? this.config.settings.delegateNumber : limit;
    
        var orderBy = orderField ? orderField[0] : null;
        var sortMode = orderField && orderField.length == 2 ? orderField[1] : 'asc';
    
        var count = delegates.length;
        var length = Math.min(limit, count);
        var realLimit = Math.min(offset + limit, count);
    
        var lastBlock = this.runtime.block.getLastBlock();
        var totalSupply = this.runtime.block.getBlockStatus().calcSupply(lastBlock.height);
    
        for (let i = 0; i < delegates.length; i++) {
            delegates[i].rate = i + 1;
            delegates[i].approval = (delegates[i].vote / totalSupply) * 100;
            delegates[i].approval = Math.round(delegates[i].approval * 1e2) / 1e2;
      
            let percent = 100 - (delegates[i].missedblocks / ((delegates[i].producedblocks + delegates[i].missedblocks) / 100));
            percent = Math.abs(percent) || 0;
      
            var outsider = i + 1 > this.config.settings.delegateNumber;
            delegates[i].productivity = (!outsider) ? Math.round(percent * 1e2) / 1e2 : 0;
      
          //   bignum update
          //   delegates[i].forged = bignum(delegates[i].fees).plus(bignum(delegates[i].rewards)).toString();
            delegates[i].forged = bignum.plus(delegates[i].fees, delegates[i].rewards).toString();
        }

        return {
            delegates,
            sortMode,
            orderBy,
            count,
            offset,
            limit: realLimit
        };
    }

    /**
     * 返回所有受托人的public_key列表
     */
    async getDelegatePublickKeysSortByVote() {
        var delegates = await this.runtime.account.getAccountList({
            is_delegate: 1,  //wxm block database
            // sort: {"vote": -1, "publicKey": 1},
            sort: [['vote', 'DESC'], ['public_key', 'ASC']], //wxm block database
            limit: this.config.settings.delegateNumber
        }, ["public_key"]);

        if (!delegates || !delegates.length) {
            throw new Error("No active delegates found");
        }

        return delegates.map(item => item.public_key);
    }

    /**
     * 返回乱序处理的受托人public_key列表
     */
    async getDisorderDelegatePublicKeys(height) {
        var truncDelegateList = await this.getDelegatePublickKeysSortByVote();
        const seedSource = await this.runtime.round.calc(height).toString();
        //wxm 对查询返回的受托人列表进行乱序处理
        let currentSeed = crypto.createHash('sha256').update(seedSource, 'utf8').digest();
        for (let i = 0, delCount = truncDelegateList.length; i < delCount; i++) {
          for (let x = 0; x < 4 && i < delCount; i++, x++) {
            const newIndex = currentSeed[x] % delCount;
            const b = truncDelegateList[newIndex];
            truncDelegateList[newIndex] = truncDelegateList[i];
            truncDelegateList[i] = b;
          }
          currentSeed = crypto.createHash('sha256').update(currentSeed).digest();
        }
    
        return truncDelegateList;
    }

    /**
     * 返回当前所有受托人列表中在本地节点配置中存在的私钥信息
     * @param {*} height 
     */
    async getActiveDelegateKeypairs(height) {
        var delegates = await this.getDisorderDelegatePublicKeys(height);
        
        const results = [];
        for (const key in this._myDelegateKeypairs) {
            if (delegates.indexOf(key) !== -1) {
                results.push(this._myDelegateKeypairs[key]);
            }
        }
        return results;
    }

    /**
     * 返回当前时间当前节点接下来可以进行铸造区块的受托人信息和时间戳
     * @param {*} curSlot 
     * @param {*} height 
     */
    async getForgeDelegateWithCurrentTime(curSlot, height) {
        var activeDelegates = await this.getDisorderDelegatePublicKeys(height);

        let currentSlot = curSlot;
        const lastSlot = this.runtime.slot.getLastSlot(currentSlot);
        for (; currentSlot < lastSlot; currentSlot += 1) {
            const delegatePos = currentSlot % this.config.settings.delegateNumber;
            const delegatePublicKey = activeDelegates[delegatePos];
            if (delegatePublicKey && this._myDelegateKeypairs[delegatePublicKey]) {
                return {
                    time: this.runtime.slot.getSlotTime(currentSlot), 
                    keypair: this._myDelegateKeypairs[delegatePublicKey]
                };
            }
        }
        return null;
    }

    async validateBlockSlot(block) {
        var activeDelegates = await this.getDisorderDelegatePublicKeys(block.height);
        var currentSlot = this.runtime.slot.getSlotNumber(block.timestamp);
        var delegateKey = activeDelegates[currentSlot % this.config.settings.delegateNumber];
        if (delegateKey && block.generator_public_key == delegateKey) {
            return;
        }
        throw new Error(`Failed to verify slot, expected delegate: ${delegateKey}`);
    }

    async validateProposeSlot(propose) {
        var activeDelegates = await this.getDisorderDelegatePublicKeys(propose.height);
        var currentSlot = this.runtime.slot.getSlotNumber(propose.timestamp);
        var delegateKey = activeDelegates[currentSlot % this.config.settings.delegateNumber];
        if (delegateKey && propose.generator_public_key == delegateKey) {
            return;
        }
        throw new Error("Failed to validate propose slot");
    }

    /**
     * 该方法向forks_stats插入数据，但未见到其他地方有用到该表数据，目前还不明白原因
     * @param {*} block 
     * @param {*} cause 
     */
    async fork(block, cause) {
        this.logger.info('Fork', {
            delegate: block.generator_public_key,
            block: {
              id: block.id,
              timestamp: block.timestamp,
              height: block.height,
              previous_block: block.previous_block
            },
            cause
        });

        return new Promise((resolve, reject) => {
            this.dao.insert('forks_stat', {
                delegate_public_key: block.generator_public_key,
                block_timestamp: block.timestamp,
                block_id: block.id,
                block_height: block.height,
                previous_block: block.previous_block,
                cause
            }, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            })
        });
    }
}

module.exports = Delegate;