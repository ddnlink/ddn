/**
 * Peer Broadcast
 * wangxm   2019-01-23
 */

var _singleton;

class PeerBroadcast {

    static singleton(context) {
        if (!_singleton) {
            _singleton = new PeerBroadcast(context);
        }
        return _singleton;
    }

    constructor(context) {
        Object.assign(this, context);
        this._context = context;
    }

    /**
     * 向随机节点广播区块和交易数据
     * @param {*} options 请求参数，包括url、method(get、post)等等
     * @param {*} dappId 是否只广播某个dappId的节点
     * @param {*} num 广播的节点个数，默认5个
     */
    async broadcast(options, dappId, num) {
        num = num || 5;

        var broadcastPeers = [];

        var peers = await this.runtime.peer.queryList(dappId, {}, num * 2);

        for (var i = 0; i < peers.length; i++) {
            var peer = peers[i];

            try 
            {
                options.peer = peer;
                var result = await this.runtime.peer.request(options, dappId, false);
                if (result && result.body) {
                    broadcastPeers.push(peer);
                    if (broadcastPeers.length == num) {
                        break;
                    }
                }
            } 
            catch(err) 
            {
            }
        }

        return {
            body: null,
            peer: broadcastPeers
        };
    }

    /**
     * 将区块数据在节点间随机进行广播
     * @param {*} block 
     * @param {*} votes 
     */
    async broadcastNewBlock(block, votes) {
        const data = {
            block: this.protobuf.encodeBlock(block).toString('base64'),
            votes: this.protobuf.encodeBlockVotes(votes).toString('base64'),
        };
        var result = await this.broadcast({ api: '/blocks', data, method: "POST" });

        setImmediate(async() => {
            try
            {
                await this.runtime.socketio.emit('blocks/change', {});
            }
            catch (err)
            {
                this.logger.error("socket emit error: blocks/change");
            }
        })

        return result;
    }

    /**
     * 将不足授权的新区块提议在节点间随机进行广播，进行确认
     * @param {*} propose 
     */
    async broadcastNewPropose(propose) {
        const data = {
            propose: this.protobuf.encodeBlockPropose(propose).toString('base64')
        }
        var result = await this.broadcast({ api: '/propose', data, method: "POST" });
        return result;
    }

    async broadcastUnconfirmedTransaction(transaction) {
        var data = {
            transaction: this.protobuf.encodeTransaction(transaction).toString('base64')
        };
        var result = await this.broadcast({ api: '/transactions', data, method: "POST" });

        setImmediate(async() => {
            try
            {
                await this.runtime.socketio.emit('transactions/change', {});
            }
            catch (err)
            {
                this.logger.error("socket emit error: transactions/change");
            }
        })

        return result;
    }

    async broadcastNewSignature(signature) {
        var result = await this.broadcast({api: '/signatures', data: { signature }, method: "POST"});
        setImmediate(async() => {
            try
            {
                await this.runtime.socketio.emit('signature/change', {});
            }
            catch (err)
            {
                this.logger.error("socket emit error: signature/change");
            }
        })
        return result;
    }

}

module.exports = PeerBroadcast;