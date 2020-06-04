/**
 * 交易核心方法和处理逻辑
 * wangxm   2018-12-28
 */
import nacl from 'tweetnacl';
import ByteBuffer from "bytebuffer";
import extend from 'util-extend';
import DdnUtils from '@ddn/utils';
import DdnCrypto from '@ddn/crypto';
import Assets from '../../assets';

let _singleton;

class Transaction {
    static singleton(context) {
        if (!_singleton) {
            _singleton = new Transaction(context);
        }
        return _singleton;
    }

    constructor(context) {
        Object.assign(this, context);
        this._context = context;

        this._unconfirmedNumber = 0;
        this._unconfirmedTransactions = [];
        this._unconfirmedTransactionsIdIndex = {};

        this._assets = Assets.singleton(context);
    }

    async execAssetFunc() {
        const args = [];
        for (let i = 0; i < arguments.length; i++) {
            args.push(arguments[i]);
        }
        await this._assets.execAssetFunc(...args);
    }

    /**
     * 根据资产配置名称获取资产实例
     * @param {*} assetName
     */
    getAssetInstanceByName(assetName) {
        return this._assets.findInstanceByName(assetName);
    }

    mountAssetApis(expressApp) {
        this._assets.mountAssetApis(expressApp);
    }

    async create(data) {
        if (!this._assets.hasType(data.type)) {
            throw new Error(`Unknown transaction type 1 ${trs.type}`);
        }

        if (!data.sender) {
            throw Error("Can't find sender");
        }

        if (!data.keypair) {
            throw Error("Can't find keypair");
        }

        let trs = {
            type: data.type,
            amount: "0",
            nethash: this.config.nethash,
            senderPublicKey: data.sender.publicKey,
            requester_public_key: data.requester ? data.requester.publicKey.toString('hex') : null, // 仅适用于多重签名
            timestamp: this.runtime.slot.getTime(),
            asset: {},
            message: data.message,
            args: data.args
        };

        trs = await this._assets.call(trs.type, "create", data, trs); // 对应各个 asset 交易类型的 async create(data, trs) 方法

        // trs.signature = await DdnCrypto.sign(trs, data.keypair);
        trs.signature = await this.sign(trs, data.keypair);
        if (data.sender.second_signature && data.second_keypair) {
            trs.sign_signature = await this.sign(trs, data.second_keypair);
            // trs.sign_signature = await DdnCrypto.sign(trs, data.second_keypair);
        }

        trs.id = await DdnCrypto.getId(trs);

        trs.fee = `${await this._assets.call(trs.type, "calculateFee", trs, data.sender)}`;

        return trs;
    }

    async objectNormalize(trs) {
        if (!this._assets.hasType(trs.type)) {
            throw Error(`Unknown transaction type 2 ${trs.type}`);
        }

        for (const p in trs) {
            if (trs[p] === null || typeof trs[p] === 'undefined') {
                delete trs[p];
            }
        }

        const validateErrors = await this.ddnSchema.validateTransaction(trs);
        if (validateErrors) {
            this.logger.error(`Failed to normalize transaction: ${trs.type} ${validateErrors[0].schemaPath} ${validateErrors[0].message}`);
            this.logger.debug(`Failed to normalize transaction: ${trs}`);
            throw new Error(`Failed to normalize transaction: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`);
        }

        return await this._assets.call(trs.type, "objectNormalize", trs);
    }

    /**
     * 序列化单条交易数据到数据库
     */
    async serializeTransaction2Db(trs, dbTrans) {
        if (!this._assets.hasType(trs.type)) {
            throw Error(`Unknown transaction type 3 : ${trs.type}`);
        }

        const newTrans = {
            id: trs.id,
            block_id: trs.block_id,
            block_height: trs.block_height,
            type: trs.type,
            timestamp: trs.timestamp,
            senderPublicKey: trs.senderPublicKey,
            requester_public_key: trs.requester_public_key,
            senderId: trs.senderId,
            recipientId: trs.recipientId || null,
            amount: `${trs.amount}`,
            fee: `${trs.fee}`,
            signature: trs.signature,
            sign_signature: trs.sign_signature,
            signatures: trs.signatures ? trs.signatures.join(',') : null,
            args: JSON.stringify(trs.args) || null,
            message: trs.message || null
        };

        return new Promise((resolve, reject) => {
            this.dao.insert('tr', newTrans, dbTrans, async (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    try {
                        await this._assets.call(trs.type, "dbSave", trs, dbTrans);
                    } catch (e) {
                        return reject(e);
                    }
                    resolve(result);
                }
            });
        });
    }

    async serializeDbData2Transaction(raw) {
        if (!raw.t_id) {
            return null
        } else {
            const trs = {
                id: raw.t_id,
                height: `${raw.b_height}`,
                block_id: raw.b_id || raw.t_blockId, //wxm block database
                type: parseInt(raw.t_type),
                timestamp: parseInt(raw.t_timestamp),
                senderPublicKey: raw.t_senderPublicKey, //wxm block database
                requester_public_key: raw.t_requesterPublicKey, //wxm block database
                senderId: raw.t_senderId, //wxm block database
                recipientId: raw.t_recipientId, //wxm block database
                amount: `${raw.t_amount}`, //DdnUtils.bignum update parseInt(raw.t_amount),
                fee: `${raw.t_fee}`, //DdnUtils.bignum update parseInt(raw.t_fee),
                signature: raw.t_signature,
                sign_signature: raw.t_signSignature, //wxm block database
                signatures: raw.t_signatures ? raw.t_signatures.split(',') : null,
                confirmations: raw.confirmations,
                args: raw.t_args ? JSON.parse(raw.t_args) : null,
                message: raw.t_message,
                asset: {}
            };

            if (!this._assets.hasType(trs.type)) {
                throw Error(`Unknown transaction type 4 ${trs.type}`);
            }

            const asset = await this._assets.call(trs.type, "dbRead", raw);
            if (asset) {
                trs.asset = extend(trs.asset, asset);
            }

            return trs;
        }
    }

    async undo(trs, block, sender, dbTrans) {
        if (!this._assets.hasType(trs.type)) {
            throw new Error(`Unknown transaction type 5 ${trs.type}`);
        }

        //wxm TODO 这里不应该使用特定的类型，应该有通用的方式
        if (trs.type === DdnUtils.assetTypes.DAPP_OUT) { //
            return await this._assets.call(trs.type, trs, block, sender);
        }

        //DdnUtils.bignum update   const amount = trs.amount + trs.fee;
        const amount = DdnUtils.bignum.plus(trs.amount, trs.fee);

        const sender1 = await this.runtime.account.merge(sender.address, {
            balance: amount,
            block_id: block.id, //wxm block database
            round: await this.runtime.round.calc(block.height)
        }, dbTrans);

        await this._assets.call(trs.type, trs, block, sender1, dbTrans);
    }

    async getUnconfirmedTransaction(trsId) {
        const index = this._unconfirmedTransactionsIdIndex[trsId];
        return this._unconfirmedTransactions[index];
    }

    async getUnconfirmedTransactionList(reverse, limit) {
        let result = [];

        for (let i = 0; i < this._unconfirmedTransactions.length; i++) {
            if (this._unconfirmedTransactions[i] !== false) {
                result.push(this._unconfirmedTransactions[i]);
            }
        }

        if (result.length > 0) {
            result = reverse ? result.reverse() : result;
        }

        if (limit) {
            result.splice(limit);
        }

        return result;
    }

    async undoUnconfirmed(transaction, dbTrans) {
        const sender = await this.runtime.account.getAccountByPublicKey(transaction.senderPublicKey);
        await this.removeUnconfirmedTransaction(transaction.id);

        if (!this._assets.hasType(transaction.type)) {
            throw new Error(`Unknown transaction type 6 ${transaction.type}`);
        }

        //wxm TODO
        //此处应该使用this._assets方法（transaction.type）来做判断
        // fixme: 2020.4.22 这里是 dapp 的交易，转移到别处？
        if (transaction.type === DdnUtils.assetTypes.DAPP_OUT) {
            return await this._assets.call(transaction.type, "undoUnconfirmed", transaction, sender);
        }

        const amount = DdnUtils.bignum.plus(transaction.amount, transaction.fee);

        this.balanceCache.addNativeBalance(sender.address, amount);

        await this.runtime.account.merge(sender.address, {
            u_balance: amount
        }, dbTrans);
        await this._assets.call(transaction.type, "undoUnconfirmed", transaction, sender, dbTrans);
    }

    async undoUnconfirmedList() {
        const ids = [];
        for (let i = 0; i < this._unconfirmedTransactions.length; i++) {
            const transaction = this._unconfirmedTransactions[i];
            if (transaction !== false) {
                ids.push(transaction.id);
                await this.undoUnconfirmed(transaction);
            }
        }
        return ids;
    }

    async applyUnconfirmed(trs, sender, dbTrans) {
        if (!sender && trs.block_id != this.genesisblock.id) { //wxm block database
            throw new Error("Invalid block id");
        } else {
            let requester = null;
            if (trs.requester_public_key) { //wxm block database
                requester = await this.runtime.account.getAccountByPublicKey(trs.requester_public_key);
                if (!requester) {
                    throw new Error("Invalid requester");
                }
            }

            if (!this._assets.hasType(trs.type)) {
                throw new Error(`Unknown transaction type 7 ${trs.type}`);
            }

            if (!trs.requester_public_key && sender.second_signature && !DdnUtils.bignum.isEqualTo(sender.second_signature, 0) &&
                !trs.sign_signature && trs.block_id != this.genesisblock.id) { //wxm block database
                throw new Error(`Failed second signature: ${trs.id}`);
            }

            if (!trs.requester_public_key && (!sender.second_signature || DdnUtils.bignum.isEqualTo(sender.second_signature, 0)) &&
                (trs.sign_signature && trs.sign_signature.length > 0)) { //wxm block database
                throw new Error("Sender account does not have a second signature");
            }

            if (trs.requester_public_key && requester.second_signature && !DdnUtils.bignum.isEqualTo(requester.second_signature, 0) && !trs.sign_signature) { //wxm block database
                throw new Error(`Failed second signature: ${trs.id}`);
            }

            if (trs.requester_public_key && (!requester.second_signature || DdnUtils.bignum.isEqualTo(requester.second_signature, 0)) &&
                (trs.sign_signature && trs.sign_signature.length > 0)) { //wxm block database
                throw new Error("Requester account does not have a second signature");
            }

            //wxm 这个逻辑应该去掉，不应该这么使用序号特殊处理，如果必须，应该是用assetTypes.type枚举
            if (trs.type === DdnUtils.assetTypes.DAPP_OUT) {
                return await this._assets.call(trs.type, "applyUnconfirmed", trs, sender, dbTrans);
            }

            const amount = DdnUtils.bignum.plus(trs.amount, trs.fee);
            if (DdnUtils.bignum.isLessThan(sender.u_balance, amount) && trs.block_id != this.genesisblock.id) { //wxm block database
                throw new Error(`Insufficient balance: ${sender.address}`);
            }

            this.balanceCache.addNativeBalance(sender.address, DdnUtils.bignum.minus(0, amount));

            const accountInfo = await this.runtime.account.merge(sender.address, {
                u_balance: DdnUtils.bignum.minus(0, amount)
            }, dbTrans);
            const newAccountInfo = Object.assign({}, sender, accountInfo); //wxm block database

            try {
                await this._assets.call(trs.type, "applyUnconfirmed", trs, newAccountInfo, dbTrans);
            } catch (err) {
                this.balanceCache.addNativeBalance(newAccountInfo.address, amount)
                await this.runtime.account.merge(newAccountInfo.address, {
                    u_balance: amount
                }, dbTrans);
                throw err;
            }

        }
    }

    async ready(trs, sender) {
        if (!this._assets.hasType(trs.type)) {
            throw Error(`Unknown transaction type 8 ${trs.type}`);
        }

        if (!sender) {
            return false;
        }

        return await this._assets.call(trs.type, "ready", trs, sender);
    }

    async apply(trs, block, sender, dbTrans) {
        if (!this._assets.hasType(trs.type)) {
            throw new Error(`Unknown transaction type 9 ${trs.type}`);
        }

        if (!await this.ready(trs, sender)) {
            throw new Error(`Transaction is not ready: ${trs.id}`);
        }

        //wxm 这个逻辑应该去掉，不应该这么使用序号特殊处理，如果必须，应该是用assetTypes.type枚举 FIXME: 2020.5
        if (trs.type === DdnUtils.assetTypes.DAPP_OUT) {
            return this._assets.call(trs.type, "apply", trs, block, sender);
        }

        const amount = DdnUtils.bignum.plus(trs.amount, trs.fee);

        if (trs.block_id != this.genesisblock.id && DdnUtils.bignum.isLessThan(sender.balance, amount)) { //wxm block database
            throw new Error(`Insufficient balance: ${sender.balance}`)
        }

        const accountInfo = await this.runtime.account.merge(sender.address, {
            balance: DdnUtils.bignum.minus(0, amount),
            block_id: block.id, //wxm block database
            round: await this.runtime.round.calc(block.height)
        }, dbTrans);
        const newSender = Object.assign({}, sender, accountInfo); //wxm block database
        await this._assets.call(trs.type, "apply", trs, block, newSender, dbTrans);
    }

    async removeUnconfirmedTransaction(id) {
        if (this._unconfirmedTransactionsIdIndex[id] == undefined) {
            return;
        }
        const index = this._unconfirmedTransactionsIdIndex[id];
        delete this._unconfirmedTransactionsIdIndex[id];
        this._unconfirmedTransactions[index] = false;
        this._unconfirmedNumber--;
    }

    async addUnconfirmedTransaction(transaction, sender) {
        try {
            await this.applyUnconfirmed(transaction, sender);
            this._unconfirmedTransactions.push(transaction);
            let index = this._unconfirmedTransactions.length - 1;
            this._unconfirmedTransactionsIdIndex[transaction.id] = index;
            this._unconfirmedNumber++;
        } catch (err) {
            await this.removeUnconfirmedTransaction(transaction.id);
            throw err;
        }
    }

    async hasUnconfirmedTransaction({
        id
    }) {
        const index = this._unconfirmedTransactionsIdIndex[id];
        const result = index !== undefined && this._unconfirmedTransactions[index] !== false;
        return result;
    }


    async process(trs, sender) {
        if (!this._assets.hasType(trs.type)) {
            throw new Error(`Unknown transaction type 10 ${trs.type}`);
        }

        let txId;
        try {
            txId = await DdnCrypto.getId(trs);
        } catch (e) {
            this.logger.error('Invalid transaction id, err: ', e)
            throw new Error("Invalid transaction id");
        }

        if (trs.id && trs.id != txId) {
            // FIXME: 这里没有要求从Asset插件端传ID，不然会出错，请确认
            throw new Error("Incorrect transaction id");
        } else {
            trs.id = txId;
        }

        if (!sender) {
            throw new Error("Invalid sender");
        }

        trs.senderId = sender.address; //wxm block database

        // Verify that requester in multisignature
        if (trs.requester_public_key) { //wxm block database
            if (!sender.multisignatures.includes(trs.requester_public_key)) { //wxm block database
                throw new Error("Failed to verify requester`s signature in multisignatures");
            }

            if (!await this.verifySignature(trs, trs.signature, trs.requester_public_key)) { //wxm block database
                throw new Error("Failed to verify requester`s signature");
            }
        } else {
            if (!await this.verifySignature(trs, trs.signature, trs.senderPublicKey)) { //wxm block database
                throw new Error("Failed to verify senderPublicKey signature here.");
            }
        }

        trs = await this._assets.call(trs.type, "process", trs, sender);

        return new Promise((resolve, reject) => {
            // shuai 2018-11-13
            this.dao.count("tr", {
                id: trs.id
            }, (err, count) => {
                if (err) {
                    this.logger.error('Database error');
                    return reject("Database error");
                }

                if (count) {
                    return reject("Ignoring already confirmed transaction");
                }

                resolve(trs);
            })
        });
    }

    async processUnconfirmedTransaction(transaction, broadcast) {
        if (!transaction) {
            throw new Error("No transaction to process!");
        }

        if (!transaction.id) {
            transaction.id = await DdnCrypto.getId(transaction);
        }

        // Check transaction indexes
        if (this._unconfirmedTransactionsIdIndex[transaction.id] !== undefined) {
            throw new Error(`Transaction ${transaction.id} already exists, ignoring...`);
        }

        await this.runtime.account.setAccount({
            publicKey: transaction.senderPublicKey
        });
        const sender = await this.runtime.account.getAccountByPublicKey(transaction.senderPublicKey);

        let requester;
        if (transaction.requester_public_key && sender && sender.multisignatures && sender.multisignatures.length) { //wxm block database
            requester = await this.runtime.account.getAccountByPublicKey(transaction.requester_public_key);
            if (!requester) {
                throw new Error("Invalid requester");
            }
        }

        transaction = await this.process(transaction, sender, requester);

        await this.verify(transaction, sender, requester);
        await this.addUnconfirmedTransaction(transaction, sender);

        if (broadcast) {
            setImmediate(async () => {
                try {
                    await this.runtime.peer.broadcast.broadcastUnconfirmedTransaction(transaction);
                } catch (err) {
                    this.logger.error(`Broadcast unconfirmed transaction failed: ${DdnUtils.system.getErrorMsg(err)}`);
                }
            });
        }
    }

    async receiveTransactions(transactions) {
        if (this._unconfirmedNumber > this.constants.maxTxsPerBlock) {
            throw new Error("Too many transactions");
        }

        for (let i = 0; i < transactions.length; i++) {
            const transaction = transactions[i];
            await this.processUnconfirmedTransaction(transaction, true);
        }

        return transactions;
    }

    //////// TODO: delete it /////////////////////////////////
    async sign(trs, { privateKey }) {
        const hash = await this.getHash(trs, true, true);
        const signature = nacl.sign.detached(
            hash,
            Buffer.from(privateKey, "hex")
        );
        return Buffer.from(signature).toString("hex");
        // return await DdnCrypto.sign(trs, keypair);
    }

    async multisign(trs, { privateKey }) {
        const hash = await this.getHash(trs, true, true);
        const signature = nacl.sign.detached(
            hash,
            Buffer.from(privateKey, "hex")
        );
        return Buffer.from(signature).toString("hex");
    }

    async getHash(trs, skipSignature, skipSecondSignature) {
        const bytes = await DdnCrypto.getBytes(trs, skipSignature, skipSecondSignature);
        return Buffer.from(nacl.hash(bytes));
    }

    // TODO: 注意使用 @ddn/crypto 的对应方法重构 2020.5.3
    async verifyBytes(bytes, signature, publicKey) {
        return DdnCrypto.verifyBytes(bytes, signature, publicKey);
    }

    /**
     * 验证签名方法
     * @param {object} trs 交易
     * @param {string} signature 签名
     * @param {string} publicKey 公钥
     */
    async verifySignature(trs, signature, publicKey) {
        if (!this._assets.hasType(trs.type)) {
            throw new Error(`Unknown transaction type 12 ${trs.type}`)
        }
        if (!signature) {
            return false;
        }

        // fixme：2020.6.2 这里的验证方法需要统一,
        // 原方法，1.delegates.test.js 无法验证通过
        // const hash = await DdnCrypto.getBytes(trs, true, true);
        // const result = DdnCrypto.verifyBytes(hash, signature, publicKey);

        const hash = await DdnCrypto.getHash(trs, true, true);
        const result = DdnCrypto.verifyHash(hash, signature, publicKey);

        return result;
    }

    async verify(trs, sender, requester) {
        if (!this._assets.hasType(trs.type)) {
            throw new Error(`Unknown transaction type 13 ${trs.type}`)
        }

        // Check sender
        if (!sender) {
            throw new Error("Invalid sender");
        }

        if (this.config.settings.enableMoreLockTypes) {
            const lastBlock = this.runtime.block.getLastBlock();

            const isLockedType = await this._assets.isSupportLock(trs.type);
            if (isLockedType && sender.lock_height && lastBlock && DdnUtils.bignum.isLessThanOrEqualTo(DdnUtils.bignum.plus(lastBlock.height, 1), sender.lock_height)) {
                throw new Error('Account is locked');
            }
        }

        if (trs.requester_public_key) {
            if (!sender.multisignatures.includes(trs.requester_public_key)) {
                throw new Error("Failed toverify requester multi signatures 4");
            }

            if (sender.publicKey != trs.senderPublicKey) {
                throw new Error("Invalid public key")
            }
        }

        //wxm 检查transaction是否有nethash属性
        if (!trs.nethash) {
            throw new Error("Transaction's nethash property is required.");
        }

        // Verify signature
        let valid = false;
        if (trs.requester_public_key) { //wxm block database
            valid = await this.verifySignature(trs, trs.signature, trs.requester_public_key); //wxm block database
        } else {
            valid = await this.verifySignature(trs, trs.signature, trs.senderPublicKey);
        }

        if (!valid) {
            throw new Error("Failed to verify requester or sender signature, 5");
        }

        if (trs.nethash && trs.nethash != this.config.nethash) {
            throw new Error("Failed to verify nethash");
        }

        // Verify second signature
        if (!trs.requester_public_key && sender.second_signature && !DdnUtils.bignum.isEqualTo(sender.second_signature, 0)) {
            valid = await this.verifySecondSignature(trs, sender.second_public_key);
            if (!valid) {
                throw new Error(`Failed to verify sender second signature: ${trs.id}`);
            }
        } else if (trs.requester_public_key && requester.second_signature && !DdnUtils.bignum.isEqualTo(requester.second_signature, 0)) { //wxm block database
            valid = await this.verifySecondSignature(trs, requester.second_public_key); //wxm block database
            if (!valid) {
                throw new Error(`Failed to verify requester second signature: ${trs.id}`);
            }
        }

        // Check that signatures unique
        if (trs.signatures && trs.signatures.length) {
            const signatures = trs.signatures.reduce((p, c) => {
                if (!p.includes(c)) p.push(c);
                return p;
            }, []);

            if (signatures.length != trs.signatures.length) {
                throw new Error("Encountered duplicate signatures");
            }
        }

        let multisignatures = sender.multisignatures || sender.u_multisignatures;
        if (multisignatures.length == 0) {
            if (trs.asset && trs.asset.multisignature && trs.asset.multisignature.keysgroup) {
                multisignatures = trs.asset.multisignature.keysgroup.map(key => key.slice(1));
            }
        }

        if (trs.requester_public_key) {
            multisignatures.push(trs.senderPublicKey);
        }

        // wxm TODO
        // 此处应该用this._assets.方法（trs.type） 来判断是否能够进入下面处理
        if (trs.signatures && trs.type !== DdnUtils.assetTypes.DAPP_OUT) { // 13 ?
            for (let d = 0; d < trs.signatures.length; d++) {
                let verify = false;

                for (let s = 0; s < multisignatures.length; s++) {
                    if (trs.requester_public_key && multisignatures[s] == trs.requester_public_key) {
                        continue;
                    }

                    if (await this.verifySignature(trs, trs.signatures[d], multisignatures[s])) {
                        verify = true;
                    }
                }

                if (!verify) {
                    throw new Error(`Failed to verify multisignature: ${trs.id}`);
                }
            }
        }

        // Check sender
        if (trs.senderId != sender.address) { //wxm block database
            throw new Error(`Invalid sender id: ${trs.id}`);
        }

        // Calc fee
        const fee = `${await this._assets.call(trs.type, "calculateFee", trs, sender)}`;

        if (!DdnUtils.bignum.isEqualTo(trs.fee, fee)) {
            throw new Error(`Invalid transaction fee: trs.fee: ${trs.fee}, asset.fee: ${fee}`);
        }

        // amount 需要整理成 正整数 形式，不包含科学计数法和点号，范围在 0 ~ totalAmount 之间
        if (DdnUtils.bignum.isLessThan(trs.amount, 0) ||
            DdnUtils.bignum.isGreaterThan(trs.amount, DdnUtils.bignum.multiply(this.constants.maxAmount, this.constants.fixedPoint)) ||
            `${trs.amount}`.includes(".") || `${trs.amount}`.includes("e")) {
            throw new Error(`Invalid transaction amount: ${trs.id}`);
        }
        // Check timestamp
        if (this.runtime.slot.getSlotNumber(trs.timestamp) > this.runtime.slot.getSlotNumber()) {
            this.logger.error('Invalid transaction timestamp:', {
                o: trs.timestamp,
                a: this.runtime.slot.getSlotNumber(trs.timestamp),
                b: this.runtime.slot.getSlotNumber()
            })
            throw new Error("Invalid transaction timestamp");
        }

        return await this._assets.call(trs.type, "verify", trs, sender);
    }

    // TODO: 与 @ddn/crypto 同名方法不同
    async verifySecondSignature(trs, publicKey) {
        if (!this._assets.hasType(trs.type)) {
            throw Error(`Unknown transaction type 14 ${trs.type}`);
        }

        if (!trs.sign_signature) {
            return false;
        }

        let bytes = await DdnCrypto.getBytes(trs, false, true);
        // const bytes = await this.getBytes(trs, false, true);
        return await this.verifyBytes(bytes, trs.sign_signature, publicKey);
    }
}

export default Transaction;