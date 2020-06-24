'use strict'

import sha256 from 'fast-sha256'
import base58 from './bs58.js'

// SHA256(SHA256(buffer))
function sha256x2 (buffer) {
  return Buffer.from(sha256.hash(sha256.hash(buffer)))
}

// Encode a buffer as a base58-check encoded string
function encode (payload) {
  const checksum = sha256x2(payload)
  return base58.encode(Buffer.concat([
    payload,
    checksum
  ], payload.length + 4))
}

function decodeRaw (buffer) {
  const payload = buffer.slice(0, -4)
  const checksum = buffer.slice(-4)
  const newChecksum = sha256x2(payload)

  if (checksum[0] ^ newChecksum[0] |
    checksum[1] ^ newChecksum[1] |
    checksum[2] ^ newChecksum[2] |
    checksum[3] ^ newChecksum[3]) return

  return payload
}

// Decode a base58-check encoded string to a buffer, no result if checksum is wrong
function decodeUnsafe (string) {
  const buffer = base58.decodeUnsafe(string)
  if (!buffer) return

  return decodeRaw(buffer)
}

function decode (string) {
  const buffer = base58.decode(string)
  const payload = decodeRaw(buffer)
  if (!payload) throw new Error('Invalid checksum')
  return payload
}

export default {
  encode: encode,
  decode: decode,
  decodeUnsafe: decodeUnsafe
}
