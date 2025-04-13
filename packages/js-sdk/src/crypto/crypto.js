import crypto from 'crypto-browserify'
import nacl from 'tweetnacl'

// 检测运行环境
const isNode = typeof process !== 'undefined' && process.versions && process.versions.node
const nodeCrypto = isNode ? require('crypto') : null

export const toLocalBuffer = (buf) => {
    return typeof window !== 'undefined' ? new Uint8Array(buf.toArrayBuffer()) : buf.toBuffer()
}

export const signBytes = (bytes, { privateKey }) => {
    const hash = (isNode ? nodeCrypto : crypto).createHash('sha256').update(bytes).digest();
    const signature = nacl.sign.detached(new Uint8Array(hash), new Uint8Array(Buffer.from(privateKey, 'hex')));
    return Buffer.from(signature).toString('hex')
}

export const generateMd5Hash = (content) => {
    return (isNode ? nodeCrypto : crypto).createHash('md5').update(content).digest('hex')
}
