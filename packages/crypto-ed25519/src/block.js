import { createHash } from './ed25519'
import ed from 'ed25519'

function getBytes(block) {
  const size =
    4 + // version (int)
    4 + // timestamp (int)
    64 + // previousBlock 64
    4 + // numberOfTransactions (int)
    64 + // totalAmount (long)
    64 + // totalFee (long)
    64 + // reward (long)
    4 + // payloadLength (int)
    32 + // payloadHash
    32 + // generatorPublicKey
    64 // blockSignature or unused
  const bb = new ByteBuffer(size, true)
  const {
    version,
    timestamp,
    previous_block,
    number_of_transactions,
    total_amount,
    total_fee,
    reward,
    payload_length,
    payload_hash,
    generator_public_key,
    block_signature
  } = block
  bb.writeInt(version)
  bb.writeInt(timestamp)

  if (previous_block) {
    bb.writeString(previous_block)
  } else {
    bb.writeString('0')
  }

  bb.writeInt(number_of_transactions)
  bb.writeString(total_amount.toString())
  bb.writeString(total_fee.toString())
  bb.writeString(reward.toString())

  bb.writeInt(payload_length)

  const payloadHashBuffer = Buffer.from(payload_hash, 'hex')
  for (let i = 0; i < payloadHashBuffer.length; i++) {
    bb.writeByte(payloadHashBuffer[i])
  }

  const generatorPublicKeyBuffer = Buffer.from(generator_public_key, 'hex')
  for (let i = 0; i < generatorPublicKeyBuffer.length; i++) {
    bb.writeByte(generatorPublicKeyBuffer[i])
  }

  if (block_signature) {
    const blockSignatureBuffer = Buffer.from(block_signature, 'hex')
    for (let i = 0; i < blockSignatureBuffer.length; i++) {
      bb.writeByte(blockSignatureBuffer[i])
    }
  }

  bb.flip()

  return bb.toBuffer()
}

function getHash(block) {
  // fixme: 2020.8.8 该方法返回 buffer, 还是使用原始 的nacl把
  return createHash(this.getBytes(block))
  // return nacl.hash(this.getBytes(block))
}

function sign(block, { privateKey }) {
  const hash = getHash(block);

  return ed.Sign(hash, { privateKey }).toString('hex');
}

function getId(block) {
  return getHash(block).toString('hex')
}

function verifySignature (block) {
  const remove = 64
  let res = null
  const { block_signature, generator_public_key } = block
  try {
    const data = getBytes(block)
    const str = data.length - remove
    const data2 = Buffer.allocUnsafe(str)

    for (let i = 0; i < data2.length; i++) {
      data2[i] = data[i]
    }
    const hash = DdnCrypto.createHash(data2)
    const blockSignatureBuffer = Buffer.from(block_signature, 'hex')
    const generatorPublicKeyBuffer = Buffer.from(generator_public_key, 'hex')
    // res = nacl.sign.detached.verify(hash, blockSignatureBuffer || ' ', generatorPublicKeyBuffer || ' ')
     res = ed.Verify(hash, blockSignatureBuffer || ' ', generatorPublicKeyBuffer || ' ');
  } catch (e) {
    this.logger.error(e)
    throw Error(e.toString())
  }

  return res
}