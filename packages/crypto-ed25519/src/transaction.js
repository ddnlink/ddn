import { getBytes } from './bytes'
async function sign(trs, { privateKey }) {
  const hash = await getHash(trs, true, true)
  const signature = ed.Sign(hash, { privateKey }).toString('hex');
  return signature
  // return await DdnCrypto.sign(trs, { privateKey })
}

async function multisign(trs, { privateKey }) {
  const hash = await this.getHash(trs, true, true)
  const signature = ed.Sign(hash, { privateKey }).toString('hex');
  return signature
}

async function getHash(trs, skipSignature, skipSecondSignature) {
  const bytes = await getBytes(trs, skipSignature, skipSecondSignature)
  return bytes
}