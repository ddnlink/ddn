/**
 * Peer Broadcast
 * wangxm   2019-01-23
 */

let _singleton

class PeerBroadcast {
  static singleton (context) {
    if (!_singleton) {
      _singleton = new PeerBroadcast(context)
    }
    return _singleton
  }

  constructor (context) {
    Object.assign(this, context)
    this._context = context
  }

  /**
   * 向随机节点广播区块和交易数据
   * @param {*} data 请求参数，包括api、params、dappId等等
   */
  broadcast (data) {
    this.runtime.peer.p2p.broadcast(data)
  }

  /**
   * 将区块数据在节点间随机进行广播
   * @param {*} block
   * @param {*} votes
   */
  async broadcastNewBlock (block, votes) {
    const data = {
      block: this.protobuf.encodeBlock(block).toString('base64'),
      votes: this.protobuf.encodeBlockVotes(votes).toString('base64')
    }
    this.broadcast({ api: '/block', data })

    setImmediate(async () => {
      try {
        await this.runtime.socketio.emit('blocks/change', {})
      } catch (err) {
        this.logger.error('socket emit error: blocks/change')
      }
    })
  }

  /**
   * 将不足授权的新区块提议在节点间随机进行广播，进行确认
   * @param {*} propose
   */
  async broadcastNewPropose (propose) {
    const data = {
      propose: this.protobuf.encodeBlockPropose(propose).toString('base64')
    }
    this.broadcast({ api: '/propose', data })
  }

  async broadcastUnconfirmedTransaction (transaction) {
    const data = {
      transaction: this.protobuf.encodeTransaction(transaction).toString('base64')
    }
    this.broadcast({ api: '/transaction', data })

    setImmediate(async () => {
      try {
        await this.runtime.socketio.emit('transactions/change', {})
      } catch (err) {
        this.logger.error('socket emit error: transactions/change')
      }
    })
  }

  async broadcastNewSignature (signature) {
    this.broadcast({ api: '/signature', data: { signature } })
    setImmediate(async () => {
      try {
        await this.runtime.socketio.emit('signature/change', {})
      } catch (err) {
        this.logger.error('socket emit error: signature/change')
      }
    })
  }
}

export default PeerBroadcast
