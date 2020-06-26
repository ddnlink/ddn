import DdnUtils from '@ddn/utils'

let _singleton

class MultiSignature {
  static singleton (context) {
    if (!_singleton) {
      _singleton = new MultiSignature(context)
    }
    return _singleton
  }

  constructor (context) {
    Object.assign(this, context)
    this._context = context
  }

  async processSignature (tx) {
    const done = async () => new Promise((resolve, reject) => {
      this.balancesSequence.add(async (cb) => {
        const transaction = await this.runtime.transaction.getUnconfirmedTransaction(tx.transaction)
        if (!transaction) {
          return reject('Transaction not found')
        }

        transaction.signatures = transaction.signatures || []
        transaction.signatures.push(tx.signature)

        setImmediate(async () => {
          try {
            await this.runtime.peer.broadcast.broadcastNewSignature({
              signature: tx.signature,
              transaction: transaction.id
            })
          } catch (err) {
            this.logger.error(`Broadcast new signature failed: ${DdnUtils.system.getErrorMsg(err)}`)
          }
        })

        cb(null, transaction)
      }, (err, transaction) => {
        if (err) {
          reject(err)
        } else {
          resolve(transaction)
        }
      })
    })

    const transaction = await this.runtime.transaction.getUnconfirmedTransaction(tx.transaction)

    if (!transaction) {
      throw new Error('Transaction not found')
    }

    if (transaction.type === DdnUtils.assetTypes.MULTISIGNATURE) {
      transaction.signatures = transaction.signatures || []

      if (transaction.asset.multisignature.signatures || transaction.signatures.includes(tx.signature)) {
        throw new Error('Permission to sign transaction denied')
      }

      // Find public key
      let verify = false
      try {
        for (let i = 0; i < transaction.asset.multisignature.keysgroup.length && !verify; i++) {
          const key = transaction.asset.multisignature.keysgroup[i].substring(1)
          verify = await this.runtime.transaction.verifySignature(transaction, tx.signature, key)
        }
      } catch (e) {
        verify = false
      }

      if (!verify) {
        throw new Error('Failed to verify signature')
      }

      await done()
    } else {
      let account
      try {
        account = await this.runtime.account.getAccountByAddress(transaction.senderId)
      } catch (err) {
        throw new Error(`Multisignature account not found: ${err}`)
      }

      let verify = false
      const multisignatures = account.multisignatures

      if (transaction.requester_public_key) {
        multisignatures.push(transaction.senderPublicKey)
      }

      if (!account) {
        throw new Error('Account not found')
      }

      transaction.signatures = transaction.signatures || []

      if (transaction.signatures.includes(tx.signature)) {
        throw new Error('Signature already exists')
      }

      try {
        for (let i = 0; i < multisignatures.length && !verify; i++) {
          verify = await this.runtime.transaction.verifySignature(transaction, multisignatures[i], tx.signature)
        }
      } catch (e) {
        throw new Error(`Failed to verify signature: ${e}`)
      }

      if (!verify) {
        throw new Error('Failed to verify signature')
      }

      setImmediate(async () => {
        try {
          await this.runtime.socketio.emit('multisignatures/singature/change', {})
        } catch (err) {
          this.logger.error('socket emit error: multisignatures/singature/change')
        }
      })

      await done()
    }
  }
}

export default MultiSignature
