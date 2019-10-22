/**
 * Peer
 * wangxm   2019-01-14
 */
const _ = require('underscore');
const ip = require('ip');
const PeerInvoker = require('../../network/peer-invoker');
const PeerSync = require('./peer-sync');
const PeerBroadcast = require('./peer-broadcast');

var _singleton;

class Peer {

    static singleton(context) {
        if (!_singleton) {
            _singleton = new Peer(context);
        }
        return _singleton;
    }

    constructor(context) {
        Object.assign(this, context);
        this._context = context;

        this._peerUpdateTimes = [];
        this._peerUpdatings = [];

        this.broadcast = PeerBroadcast.singleton(this._context);
    }

    async prepare() {
        var peers = this.config.peers.list;

        for (var i = 0; i < peers.length; i++) {
            var peer = peers[i];

            await new Promise((resolve, reject) => {
                this.dao.findOne('peer', { 
                    ip: ip.toLong(peer.ip), 
                    port: peer.port 
                }, null, (err, result) => {
                    if (err) {
                        reject(err);
                    } else if (!result) {
                        this.dao.insertOrUpdate('peer', {
                            ip: ip.toLong(peer.ip), 
                            port: peer.port, 
                            state: 2
                        }, (err2, result2) => {
                            if (err2) {
                                reject(err2);
                            } else {
                                resolve();
                            }
                        });
                    } else {
                        resolve();
                    }
                })
            })
        }

        return new Promise((resolve, reject) => {
            this.dao.count('peer', {}, async (err, count) => {
                if (err) {
                    reject(err);
                } else {
                    if (count) {
                        await this.syncPeersList();
                        this.logger.info(`Peers ready, stored ${count}`);

                        resolve();
                    } else {
                        this.logger.warn('Peers list is empty');
                        resolve();
                    }
                }
            });
        })
    }

    async getVersion() {
        return {
            version: this.config.version,
            build: this.config.buildVersion,
            net: this.config.netVersion
        };
    }

    async addDapp(config) {
        return new Promise((resolve, reject) => {
            this.dao.findOne('peer', {
                ip: config.ip, 
                port: config.port 
            }, null, (err, data) => {
                if (err) {
                    return reject(err);
                }

                if (data) {
                    this.dao.findOne('peers_dapp', {
                        peer_id: data.id 
                    }, null, (err2, data2) => {
                        if (err2) {
                            return reject(err2);
                        }

                        if (!data2) {
                            this.dao.insert('peers_dapp', {
                                peer_id: data.id, 
                                dapp_id: config.dappId 
                            }, (err3, data3) => {
                                if (err3) {
                                    reject(err3);
                                } else {
                                    resolve();
                                }
                            });
                        } else {
                            resolve();
                        }
                    });
                } else {
                    reject('Peer not found: ' + config.ip);
                }
            });
        });
    }

    async update(peer) {
        if (peer && peer.ip && peer.port) {
            const dappId = peer.dappId;

            if (this.config.publicIp) {
                var localIp = ip.toLong(this.config.publicIp);
                if (localIp == peer.ip && this.config.port == peer.port) {
                    return;
                }
            }

            const peerData = {
                ip: peer.ip,
                port: peer.port,
                os: peer.os || null,
                version: peer.version || null,
                state: peer.state || 1,
            };
            
            var peerKey = peer.ip + "_" + peer.port;

            let needUpdateToDB = true;
            if(this._peerUpdateTimes.length >= 0){
                if (this._peerUpdateTimes[peerKey]) {
                    if (new Date().getTime() - this._peerUpdateTimes[peerKey] > 1000 * 29) {
                        needUpdateToDB = true;
                    } else {
                        needUpdateToDB = false;
                    }
                }
            } else {
                needUpdateToDB = true;
            }
          
            if (needUpdateToDB && !this._peerUpdatings[peerKey]) {
                this._peerUpdatings[peerKey] = true;

                return new Promise((resolve, reject) => {
                    this.dao.findOne('peer', { 
                        ip: peerData.ip, 
                        port: peerData.port 
                    }, null, (err, data) => {
                        if (!err) {
                            if(data && data.state === 0) {
                                delete peerData.state;
                            }

                            this.dao.insertOrUpdate('peer', peerData, null, async (err2, data2) => {
                                if (!err2) {
                                    if (dappId) {
                                        await this.addDapp({dappId, ip: peer.ip, port: peer.port});
                                    } else {
                                        this._peerUpdateTimes[peerKey] = new Date().getTime();
                                    }
                                }

                                this._peerUpdatings[peerKey] = false;
                                resolve();
                            });
                        } else {
                            this._peerUpdatings[peerKey] = false;
                            resolve();
                        }
                    });
                })
            }
        }
    }

    /**
     * 请求节点指定接口（默认随机节点，也可指定args.peer来使用指定节点）
     * @param {*} args 
     * @param {*} dappId 
     * @param {*} allowSelf 
     */
    async request(args, dappId, allowSelf) {
        try
        {
            return await PeerInvoker.singleton(this._context).invoke(args, dappId, allowSelf);
        }
        catch (err)
        {
            throw err;
        }
    }

    /**
     * 从其他节点同步节点列表
     */
    async syncPeersList() {
        var data;
        try
        {
            data = await this.request({
                api: '/list',
                method: 'GET'
            });
        }
        catch (err)
        {
            this.logger.error('Sync PeerList has error: ' + err);
            return;
        }

        if (data && data.body && data.body.peers && data.body.peers.length) {
            const peers = data.body.peers;
            for (var i = 0; i < peers.length; i++) {
                var validateErrors = await this.ddnSchema.validatePeer(peer);
                if (validateErrors) {
                    this.logger.error(`Invalid peer: ${validateErrors[0].message}`);
                    continue;
                }
        
                peer.ip = parseInt(peer.ip);
        
                if (isNaN(peer.ip)) {
                    continue;
                }

                if (ip.toLong("127.0.0.1") == peer.ip || peer.port == 0 || peer.port > 65535) {
                    continue;
                }

                if (await this.isCompatible(peer.version)) {
                    await this.update(peer);
                }
            }
        }
    }

    /**
     * 从随机节点同步区块数据
     */
    async syncBlocks() {
        return await PeerSync.singleton(this._context).trySyncBlockData();
    }

    async syncSignatures() {
        return await PeerSync.singleton(this._context).trySyncSignatures();
    }

    /**
     * 从随机节点同步未确认交易
     */
    async syncUnconfirmedTransactions() {
        return await PeerSync.singleton(this._context).trySyncUnconfirmedTransactions();
    }

    async isCompatible(version) {
        const nums = (version + "").split('.').map(Number);
        if (nums.length != 3) {
            return true;
        }

        const compatibleVersion = this.tokenSetting[this.config.netVersion].compatibleVersion;
      
        const numsCompatible = compatibleVersion.split('.').map(Number);
        for (let i = 0; i < nums.length; ++i) {
          if (nums[i] < numsCompatible[i]) {
            return false;
          } else if (nums[i] > numsCompatible[i]) {
            return true;
          }
        }
        return true;
    }

    async remove(pip, port) {
        const isStaticPeer = this.config.peers.list.find(peer => peer.ip == ip.fromLong(pip) && peer.port == port);
        if (isStaticPeer) {
            this.logger.info("Peer in white list, can't remove.");
        } else {
            return new Promise((resolve, reject) => {
                this.dao.remove('peer', { 
                    ip: pip, 
                    port 
                }, (err, result) => {
                    if (err) {
                        this.logger.error("remove peer: " + err);
                    }
                    resolve();
                });
            });
        }
    }

    /**
     * 恢复暂停的节点服务状态为可用（已达到暂停时间的）
     */
    async restoreBanState() {
        return await new Promise((resolve) => {
            this.dao.update('peer', { state: 1, clock: null }, 
                { state: 0, clock: { '$lt': Date.now() } },
                (err, result) => {
                    if (err) {
                        resolve(false);
                    } else {
                        resolve(true);
                    }
                });
        })
    }    

    /**
     * 修改指定节点服务的状态
     * @param {*} pip 节点IP
     * @param {*} port 服务端口
     * @param {*} state 状态（0：停用，1：可用，2：健康）
     * @param {*} timeoutSeconds 服务暂停时间（单位：秒）
     */
    async changeState(pip, port, state, timeoutSeconds) {
        const isStaticPeer = this.config.peers.list.find(peer => peer.ip == ip.fromLong(pip) && peer.port == port);
        if (isStaticPeer) {
            this.logger.info("Peer in white list, the state can't change.");
        } else {
            var clock = null;
            if (state == 0) {
                clock = Date.now() + (timeoutSeconds || 1) * 1000;
            }

            return new Promise((resolve, reject) => {
                this.dao.update('peer', 
                    { state, clock }, 
                    { ip: pip, port}, err => {
                    err && this.logger.error('Peer#state', err);
                    resolve();
                });
            })
        }
    }

    /**
     * 重置所有节点服务状态为健康
     */
    async reset() {
        return new Promise((resolve, reject) => {
            this.dao.update('peer', { state: 2 }, {}, null,err => {
                if (err) {
                    this.logger.error(`Failed to reset peers: ${e}`);
                    reject(err);
                } else {
                    resolve();
                }
            });
        })
    }

    async getRandomPeer(dappId, allowSelf) {
        var peers = await this.queryList(dappId, {state: {'$gt': 0}}, 2);
        if (peers && peers.length) {
            var peer = peers[0];
            var peerIp = ip.fromLong(peer.ip);
            if ((peerIp == '127.0.0.1' || peerIp == this.config.publicIp) &&
                (peer.port == this.config.port) && !allowSelf) {
                if (peers.length > 1) {
                    return peers[1];
                } else {
                    await this.reset();
                    this.logger.warn("single none does not need sychronization.");

                    return null;
                }
            } else {
                return peer;
            }
        } else {
            await this.reset();
            this.logger.warn("No peers in db");

            return null;
        }
    }

    async queryDappPeers() {
        var data = await new Promise((resolve, reject) => {
            this.dao.findList('peers_dapp', {}, 
                null, null, (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                }
            );
        });

        var where = { 
            id: {
                '$in': _.pluck(data, 'peer_id')
            }
        };
        return new Promise((resolve, reject) => {
            this.dao.findList('peer', where, 
                null, null, (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                }
            );
        })
    }

    async queryList(dappId, where, limit) {
        var data = null;

        if (dappId) {
            data = await new Promise((resolve, reject) => {
                this.dao.findPage('peers_dapp', { 
                    dapp_id: dappId 
                }, limit ? limit : this.config.settings.delegateNumber, 
                null, false, (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            })
        }

        where = where || {};
        if (data) {
            where.id = {'$in': _.pluck(data, 'peer_id')}
        }

        return new Promise((resolve, reject) => {
            this.dao.findPage('peer', where, 
                limit ? limit : this.config.settings.delegateNumber, 
                null, false, null, [[this.dao.db_fnRandom()]], (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                })
        });
    }

}

module.exports = Peer;