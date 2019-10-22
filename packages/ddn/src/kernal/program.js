/**
 * 主程序
 * wangxm   2018-12-27
 */
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const ip = require('ip');
const Logger = require('../logger');
const Context = require('./context');
const Block = require('./block/block');
const Transaction = require('./transaction/transaction');
const Account = require('./account/account');
const Slot = require('./lib/slot');
const Round = require('./lib/round');
const Delegate = require('./lib/delegate');
const Consensus = require('./lib/consensus');
const Peer = require('./peer/peer');
const dbUpgrade = require('../db/db-upgrade');
const { RuntimeState, Utils } = require('@ddn/ddn-utils');
const HttpServer = require('../network/http-server');
const MultiSignature = require('./lib/multisignature');
const crypto = require('crypto');
const bignum = require('@ddn/bignum-utils');
const DataQuery = require('./lib/data-query');

class Program
{
    async _init(options) {
        options.logger = new Logger({
            filename: path.join(options.baseDir, 'logs', 'debug.log'),
            echo: options.isDaemonMode ? null : options.configObject.logLevel,
            errorLevel: options.configObject.logLevel
        });

        if (!options.configObject.publicIp) {
            options.configObject.publicIp = Utils.getPublicIp();
        }

        this._context = new Context();
        await this._context.init(options);

        this._context.runtime.state = RuntimeState.Pending;
        //区块核心处理模块
        this._context.runtime.block = Block.singleton(this._context);
        //交易核心处理模块
        this._context.runtime.transaction = Transaction.singleton(this._context);
        //账户核心处理模块
        this._context.runtime.account = Account.singleton(this._context);
        //multisignature
        this._context.runtime.multisignature = MultiSignature.singleton(this._context);
        //Slot
        this._context.runtime.slot = Slot.singleton(this._context);
        //Delegate
        this._context.runtime.delegate = Delegate.singleton(this._context);
        //Round
        this._context.runtime.round = Round.singleton(this._context);
        //Consensus
        this._context.runtime.consensus = Consensus.singleton(this._context);
        //Peer
        this._context.runtime.peer = Peer.singleton(this._context);
        //Data Query
        this._context.runtime.dataquery = DataQuery.singleton(this._context);

        //锁文件，存储当前运行进程的ID
        this._pid_file = path.join(options.baseDir, 'ddn.pid');

        //节点列表同步任务的轮询间隔（3-1个轮询会执行一次同步）
        this._peerSyncCounter = 3;
    }

    /**
     * 文件锁，保证系统只能运行一份
     */
    _checkProcessState() {
        if (this._context.isDaemonMode) {
            try
            {
                var fd = fs.openSync(this._pid_file, 'wx');
                fs.writeSync(fd, process.pid);
                fs.closeSync(fd);
            }
            catch (err)
            {
                console.log('Failed: DDN server already started');
                process.exit(1);
                return;
            }
        } else {
            if (fs.existsSync(this._pid_file)) {
                console.log('Failed: DDN server already started');
                process.exit(1);
                return;
            }
        }
    }

    /**
     * 释放文件锁
     */
    _resetProcessState() {
        try
        {
            if (fs.existsSync(this._pid_file)) {
                fs.unlinkSync(this._pid_file);
            }
        }
        catch (err)
        {
            console.error(Utils.getErrorMsg(err));
        }
    }

    /**
     * 升级数据库结构
     */
    async _applyDatabaseUpgrade() {
        return new Promise((resolve, reject) => {
            dbUpgrade.upgrade(this._context, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        })
    }

    /**
     * 校验创世区块的数据
     */
    async _checkGenesisBlock() {
        var block = this._context.genesisblock;

        const payloadHash = crypto.createHash('sha256');
        let payloadLength = 0;
    
        for (const trs of block.transactions) {
            const bytes = await this._context.runtime.transaction.getBytes(trs);
            payloadLength += bytes.length;
            payloadHash.update(bytes);
        }

        const id = this._context.runtime.block.getId(block);

        assert.equal(payloadLength, block.payload_length, 'Unexpected payloadLength');
        assert.equal(payloadHash.digest().toString('hex'), block.payload_hash, 'Unexpected payloadHash');
        assert.equal(id, block.id, 'Unexpected block id');

        return true;
    }
    
    async run(options) {
        //如果是后台模式，禁止输出
        if (options.isDaemonMode) {
            require('daemon')({cwd: process.cwd()});
        }

        process.once('cleanup', () => {
            this._context.logger.info('Cleaning up...');
    
            this._resetProcessState();
            process.exit(1);
        });

        process.once('SIGTERM', () => {
            process.emit('cleanup');
        })
      
        process.once('exit', () => {
            this._context.logger.info('process exited');
        });
      
        process.once('SIGINT', () => {
            process.emit('cleanup');
        });
      
        process.on('uncaughtException', err => {
            this._context.logger.fatal('uncaughtException', { message: err.message, stack: err.stack });
            process.emit('cleanup');
        });
      
        if (typeof(gc) == 'function') {
            setInterval(() => {
                gc();
            }, 1000 * 60 * 30);
        }

        //初始化运行时上下文、核心模块等
        await this._init(options);

        //文件锁，保证系统只能运行一份
        this._checkProcessState();

        process.stdin.resume();

        //应用最新数据库升级
        await this._applyDatabaseUpgrade();

        //验证创世区块数据是否合法
        if (!await this._checkGenesisBlock()) {
            process.exit(1);
            return;
        }

        if (!this._context.config.publicIp) {
            this._context.logger.warn("Failed to get public ip, block forging may not work!");
        }

        //初始化创世区块
        await this._context.runtime.block.handleGenesisBlock();

        //初始化账户以及余额
        try
        {
            await this._context.runtime.account.initAccountsAndBalances();
        }
        catch (err)
        {
            this._context.logger.error('Failed to load blockchain', Utils.getErrorMsg(err));
            return process.exit(1);
        }

        //启动准备（节点）
        await this._context.runtime.peer.prepare();

        //启动准备（受托人）
        await this._context.runtime.delegate.prepare();

        //启动准备（Round）
        await this._context.runtime.round.prepare();

        //启动节点网络服务
        this._context.runtime.httpserver = await HttpServer.newServer(this._context).start();

        //系统准备完毕，进入待命状态
        if (this._context.isDaemonMode) {
            this._context.logger.info("DDN server started as daemon ...");
        } else {
            this._context.logger.info("DDN Start Successfully!");
        }

        //启动节点管理任务
        await this.startPeerSyncTask();

        //启动区块数据同步任务
        await this.startBlockDataSyncTask();

        //启动区块未确认交易的同步任务
        await this.startUnconfirmedTransactionSyncTask();

        //启动签名同步任务
        await this.startSignaturesSyncTask();

        //启动区块铸造任务
        await this.startForgeBlockTask();
    }

    async _blockchainReady () {
        if (!this._blockchainReadyFired && 
            this._context.runtime.state == RuntimeState.Ready) {

            //通知资产系统已就绪事件
            await this._context.runtime.transaction.execAssetFunc("onBlockchainReady");
            this._blockchainReadyFired = true;
        }
    }

    /**
     * 获取一个有效节点（非本机自己）
     */
    async getValidPeer() {
        try
        {
            const publicIp = this._context.config.publicIp || "127.0.0.1";
            const publicIpLongValue = ip.toLong(publicIp);
            const port = this._context.config.port;
            const result = await this._context.runtime.peer.queryList(null, {state: {'$gt': 0}, "$not": {ip: publicIpLongValue, port: port}}, 1);
            if (result && result.length) {
                return result[0];
            }
        }
        catch (err)
        {
        }
        return null;
    }

    /**
     * 同步节点列表 & 维护本地节点状态
     */
    async startPeerSyncTask() {
        const validPeer = await this.getValidPeer();
        if (validPeer) {
            try {
                await(async() => {
                    if (this._peerSyncCounter == 0) {
                        await this._context.runtime.peer.syncPeersList();
                        this._peerSyncCounter = 3;
                    }
                    this._peerSyncCounter--;

                    await this._context.runtime.peer.restoreBanState();
                })();
            }
            catch (err)
            {
                this._context.logger.warn("The peer sync task error: " + err);
            }

            setTimeout(() => { 
                this.startPeerSyncTask();
            }, 1000 * 49);
        }
    }

    /**
     * 签名同步任务（轮询）
     */
    async startSignaturesSyncTask()
    {
        const validPeer = await this.getValidPeer();
        if (validPeer) {
            try
            {
                await (async() => {
                    await this._context.runtime.peer.syncSignatures();
                })();
            }
            catch (err)
            {
                this._context.logger.warn("The signatures sync task error: " + err);
            }

            setTimeout(() => {
                this.startSignaturesSyncTask();
            }, 1000 * 14);
        }
    }

    /**
     * 同步未确认交易（轮询）
     */
    async startUnconfirmedTransactionSyncTask()
    {
        const validPeer = await this.getValidPeer();
        if (validPeer) {
            try
            {
                await (async() => {
                    if (this._context.runtime.state == RuntimeState.Syncing) {
                        return;
                    }

                    await this._context.runtime.peer.syncUnconfirmedTransactions();
                })();
            }
            catch (err)
            {
                this._context.logger.warn("The unconfirmed transaction sync task error: " + err);
            }

            setTimeout(() => {
                this.startUnconfirmedTransactionSyncTask();
            }, 1000 * 14);
        }
    }

    /**
     * 同步节点区块数据（轮询）
     */
    async startBlockDataSyncTask() {
        const validPeer = await this.getValidPeer();
        if (validPeer) {
            try
            {
                await (async() => {
                    if (this._context.runtime.state == RuntimeState.Syncing) {
                        return;
                    }

                    var lastBlock = this._context.runtime.block.getLastBlock();
                    var lastSlot = this._context.runtime.slot.getSlotNumber(lastBlock.timestamp);
                    if (this._context.runtime.slot.getNextSlot() - lastSlot >= 3) {
                        this._context.runtime.state = RuntimeState.Syncing;

                        this._context.logger.debug('startSyncBlocks enter');

                        await new Promise((resolve) => {
                            this._context.sequence.add(async (cb) => {
                                this._context.logger.debug('startSyncBlocks enter sequence');
                                try {
                                    var syncCompleted = await this._context.runtime.peer.syncBlocks();
                                    cb(null, syncCompleted);
                                } catch (syncErr) {
                                    cb(syncErr);
                                }
                            }, async (err, syncCompleted) => {
                                err && this._context.logger.error('loadBlocks timer:', err);
                                this._context.logger.debug('startSyncBlocks end');

                                if (syncCompleted) {
                                    this._context.runtime.state = RuntimeState.Ready;
                                    await this._blockchainReady();
                                } else {
                                    this._context.runtime.state = RuntimeState.Pending;
                                }

                                resolve();
                            });
                        });
                    }
                })();
            }
            catch (err)
            {
                this._context.logger.warn("The block sync task error: " + err);   
            }
            
            setTimeout(async () => { 
                await this.startBlockDataSyncTask();
            }, 1000 * 10);
        } else {
            this._context.runtime.state = RuntimeState.Ready;
            await this._blockchainReady();
        }
    }

    /**
     * 尝试铸造区块（轮询）
     */
    async startForgeBlockTask() {
        await (async () => {
            if (this._context.runtime.state != RuntimeState.Ready) {
                return;
            }

            if (!this._context.runtime.delegate.isForgeEnabled()) {
                this._context.logger.trace('Loop:', 'forging disabled');
                return;
            }

            if (!this._context.runtime.delegate.hasValidDelegates()) {
                this._context.logger.trace('Loop:', 'no delegates');
                return;
            }

            //wxm TODO 这里全部改成同步后，不需要再判断这些了，因为这些已经ok了，不ok一定不会执行到这里
            // if (!privated.loaded || !modules.loader.syncCompleted() || !modules.round.loaded()) {    //wxm   要改成同步完成状态   modules.loader.syncing()
            //     library.logger.trace('Loop:', 'node not ready');
            //     return setImmediate(cb);
            // }
            
            const currentSlot = this._context.runtime.slot.getSlotNumber();

            const lastBlock = this._context.runtime.block.getLastBlock();

            if (currentSlot == this._context.runtime.slot.getSlotNumber(lastBlock.timestamp)) {
                // library.logger.debug('Loop:', 'lastBlock is in the same slot');
                return;
            }

            if (Date.now() % (this._context.config.settings.blockIntervalTime * 1000) > (this._context.config.settings.blockIntervalTime * 1000) / 2) {
                this._context.logger.trace('Loop:', 'maybe too late to collect votes');
                return;
            }

            var forgeDelegateInfo = await this._context.runtime.delegate.getForgeDelegateWithCurrentTime(currentSlot, bignum.plus(lastBlock.height, 1));
            if (forgeDelegateInfo === null) {
                this._context.logger.trace('Loop:', 'skipping slot');
                return;
            }

            await new Promise((resolve) => {
                this._context.sequence.add(async (cb) => {
                    if (this._context.runtime.slot.getSlotNumber(forgeDelegateInfo.time) == this._context.runtime.slot.getSlotNumber() &&
                        this._context.runtime.block.getLastBlock().timestamp < forgeDelegateInfo.time ) {
                        try
                        {
                            await this._context.runtime.block.generateBlock(forgeDelegateInfo.keypair, forgeDelegateInfo.time);
                        }
                        catch (err)
                        {
                            this._context.logger.error("铸造区块异常: " + Utils.getErrorMsg(err));
                        }
                    }

                    cb();
                }, (err) => {
                    if (err) {
                        this._context.logger.error("Failed generate block within slot:", err);
                    }

                    resolve();
                });
            });
        })();

        setTimeout(() => {
            this.startForgeBlockTask();
        }, 100);
    }

    destory() {
        this._resetProcessState();
    }
}

module.exports = Program;