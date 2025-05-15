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
    try {
      // 确保 votes 是有效的对象
      if (!votes || typeof votes !== 'object') {
        this.logger.error('Invalid votes object for broadcast');
        votes = { height: block.height, id: block.id, signatures: [] };
      }

      // 确保 signatures 是数组
      if (!Array.isArray(votes.signatures)) {
        this.logger.error('Invalid signatures array in votes');
        votes.signatures = [];
      }

      // 深拷贝以避免修改原始对象
      let votesToBroadcast;
      try {
        votesToBroadcast = JSON.parse(JSON.stringify(votes));
      } catch (jsonErr) {
        this.logger.error(`Failed to clone votes object: ${jsonErr.message}`);
        votesToBroadcast = { height: block.height, id: block.id, signatures: [] };
      }

      // 确保每个签名都有正确的格式
      const validSignatures = [];
      for (let i = 0; i < votesToBroadcast.signatures.length; i++) {
        const signature = votesToBroadcast.signatures[i];
        if (signature && typeof signature === 'object' &&
            typeof signature.key === 'string' &&
            typeof signature.sig === 'string') {
          validSignatures.push(signature);
        } else {
          this.logger.warn(`Invalid signature at index ${i}, removing from broadcast`);
        }
      }

      // 替换原始签名数组
      votesToBroadcast.signatures = validSignatures;

      // 限制签名数量，避免数据过大
      if (votesToBroadcast.signatures.length > 6) {
        votesToBroadcast.signatures = votesToBroadcast.signatures.slice(0, 6);
      }

      try {
        const data = {
          block: this.protobuf.encodeBlock(block).toString('base64'),
          votes: this.protobuf.encodeBlockVotes(votesToBroadcast).toString('base64')
        }

        this.broadcast({ api: '/block', data });

        setImmediate(async () => {
          try {
            await this.runtime.socketio.emit('blocks/change', {});
          } catch (err) {
            this.logger.error('socket emit error: blocks/change');
          }
        });
      } catch (encodeErr) {
        this.logger.error(`Failed to encode block or votes: ${encodeErr.message}`);
      }
    } catch (err) {
      this.logger.error(`Failed to broadcast new block: ${err.message}`);
      // 不抛出错误，避免中断区块处理流程
    }
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
