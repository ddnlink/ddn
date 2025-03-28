import crypto from 'crypto-browserify'
import nacl from 'tweetnacl'

export const toLocalBuffer = (buf) => {
    return typeof window !== 'undefined' ? new Uint8Array(buf.toArrayBuffer()) : buf.toBuffer()
}

export const signBytes = (bytes, { privateKey }) => {
    const hash = crypto.createHash(Buffer.from(bytes, 'hex'))
    const signature = nacl.sign.detached(hash, Buffer.from(privateKey, 'hex'))
    return Buffer.from(signature).toString('hex')
}

export const generateMd5Hash = (content) => {
    return crypto.createHash('md5').update(content).digest('hex')
}
