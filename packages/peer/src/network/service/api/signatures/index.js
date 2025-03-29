/**
 * RootRouter接口
 * wangxm   2019-03-27
 */
import * as DdnCrypto from '@ddn/crypto'
import { assetTypes, bignum } from '@ddn/utils'

class RootRouter {
  constructor (context) {
    Object.assign(this, context)
    this._context = context
  }

  async put (req) {
    const body = req.body
    const validateErrors = await this.ddnSchema.validate(
      {
        type: 'object',
        properties: {
          secret: {
            type: 'string',
            minLength: 1
          },
          secondSecret: {
            type: 'string',
            minLength: 1
          },
          publicKey: {
            type: 'string',
            format: 'publicKey'
          },
          multisigAccountPublicKey: {
            type: 'string',
            format: 'publicKey'
          }
        },
        required: ['secret', 'secondSecret']
      },
      body
    )
    if (validateErrors) {
      throw new Error(`Invalid parameters: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`)
    }

    const keypair = DdnCrypto.getKeys(body.secret)

    if (body.publicKey) {
      if (keypair.publicKey !== body.publicKey) {
        throw new Error('Invalid passphrase')
      }
    }

    return this.balancesSequence.addAsync(async () => {
      try {
        if (body.multisigAccountPublicKey && body.multisigAccountPublicKey !== keypair.publicKey) {
          const account = await this.runtime.account.getAccountByPublicKey(body.multisigAccountPublicKey);
          
          if (!account) throw new Error('Multisignature account not found');
          if (!account.multisignatures?.length) throw new Error('Account does not have multisignatures enabled');
          if (!account.multisignatures.includes(keypair.publicKey)) throw new Error('Account does not belong to multisignature group');
          if (account.second_signature || account.u_second_signature) throw new Error('Invalid second passphrase');

          const requester = await this.runtime.account.getAccountByPublicKey(keypair.publicKey);
          if (!requester?.publicKey) throw new Error('Invalid requester');
          if (requester.second_signature && !body.secondSecret) throw new Error('Invalid second passphrase');
          if (requester.publicKey === account.publicKey) throw new Error('Invalid requester');

          const second_keypair = DdnCrypto.getKeys(body.secondSecret);
          const transaction = await this.runtime.transaction.create({
            type: assetTypes.SIGNATURE,
            sender: account,
            keypair,
            requester: keypair,
            second_keypair
          });
          return await this.runtime.transaction.receiveTransactions([transaction]);
        } else {
          const account = await this.runtime.account.getAccountByPublicKey(keypair.publicKey);
          if (!account) throw new Error('Account not found');
          if (account.second_signature && !body.secondSecret) throw new Error('Invalid second passphrase');

          const second_keypair = DdnCrypto.getKeys(body.secondSecret);
          const transaction = await this.runtime.transaction.create({
            type: assetTypes.SIGNATURE,
            sender: account,
            keypair,
            second_keypair
          });
          return await this.runtime.transaction.receiveTransactions([transaction]);
        }
      } catch (e) {
        throw new Error(e.message || 'Create signature transaction failed');
      }
    }).then(transactions => ({
      success: true,
      transaction: transactions?.[0]
    }));
  }

  async getFee (req) {
    const fee = bignum.multiply(this.constants.net.fees.signature, this.constants.fixedPoint).toFixed()
    return { success: true, fee }
  }
}

export default RootRouter
