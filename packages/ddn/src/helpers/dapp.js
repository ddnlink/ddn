import nacl from 'tweetnacl'
import DdnCrypto from '@ddn/crypto'
import ByteBuffer from 'bytebuffer'
import dappTransactionsLib from '../dapptransactions'
import accounts from './account'

function getBytes (block, skipSignature) {
  const size = 8 + 4 + 4 + 4 + 32 + 32 + 8 + 4 + 4 + 64

  const bb = new ByteBuffer(size, true)

  bb.writeString(block.prevBlockId || '0')

  // bignum update bb.writeLong(block.height);
  bb.writeString(`${block.height}`)
  bb.writeInt(block.timestamp)
  bb.writeInt(block.payloadLength)

  const ph = Buffer.from(block.payloadHash, 'hex')
  for (let i = 0; i < ph.length; i++) {
    bb.writeByte(ph[i])
  }

  const pb = Buffer.from(block.delegate, 'hex')
  for (let i = 0; i < pb.length; i++) {
    bb.writeByte(pb[i])
  }

  bb.writeString(block.pointId || '0')

  // bignum update bb.writeLong(block.pointHeight || 0);
  bb.writeString((`${block.pointHeight}`) || '0')

  bb.writeInt(block.count)

  if (!skipSignature && block.signature) {
    const pb = Buffer.from(block.signature, 'hex')
    for (let i = 0; i < pb.length; i++) {
      bb.writeByte(pb[i])
    }
  }

  bb.flip()

  return bb.toBuffer()
}

// from ../block.js
function getHash (block) {
  return Buffer.from(nacl.hash(getBytes(block)))
}

function sign (block, { privateKey }) {
  const hash = getHash(block)

  const data = nacl.sign.detached(hash, Buffer.from(privateKey, 'hex'))
  return Buffer.from(data).toString('hex')
}

function getId (block) {
  return getHash(block).toString('hex')
}

export default {
  async new ({ keypair, address }, publicKeys, assetInfo) {
    const sender = accounts.account(DdnCrypto.generateSecret())
    let payloadBytes = ''

    const block = {
      delegate: keypair.publicKey,
      height: '1',
      pointId: null,
      pointHeight: null,
      transactions: [],
      timestamp: 0,
      payloadLength: 0,
      payloadHash: null
    }

    if (assetInfo) {
      const assetTrs = {
        fee: '0',
        timestamp: 0,
        senderPublicKey: sender.keypair.publicKey,
        type: 3,
        args: JSON.stringify([
          assetInfo.name,
          String(Number(assetInfo.amount) * (10 ** assetInfo.precision)),
          address
        ])
      }
      const bytes = dappTransactionsLib.getTransactionBytes()
      assetTrs.signature = await DdnCrypto.sign(assetTrs, sender.keypair)
      block.payloadLength += bytes.length
      payloadBytes += bytes

      assetTrs.id = await DdnCrypto.getId(assetTrs)
      block.transactions.push(assetTrs)
    }
    block.count = block.transactions.length

    block.payloadHash = DdnCrypto.createHash(Buffer.from(payloadBytes))

    block.signature = sign(block, keypair) // fixme 应该是 block 的
    block.id = getId(block)

    return block
  }
}
