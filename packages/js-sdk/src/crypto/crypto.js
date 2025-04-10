import crypto from 'crypto-browserify'
import nacl from 'tweetnacl'

export const toLocalBuffer = (buf) => {
    return typeof window !== 'undefined' ? new Uint8Array(buf.toArrayBuffer()) : buf.toBuffer()
}

export const signBytes = (bytes, { privateKey }) => {
    const hash = crypto.createHash('sha256').update(bytes).digest();
    const signature = nacl.sign.detached(new Uint8Array(hash), new Uint8Array(Buffer.from(privateKey, 'hex')));
    return Buffer.from(signature).toString('hex')
}

export const generateMd5Hash = (content) => {
    return crypto.createHash('md5').update(content).digest('hex')
}
