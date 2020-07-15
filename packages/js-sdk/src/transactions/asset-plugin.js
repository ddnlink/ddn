import Asset from '@ddn/asset-base'
import crypto from '../utils/crypto'
import slots from '../time/slots'
import options from '../options'
// import constants from '../constants';

async function createPluginAsset (trsType, assetInfo, secret, secondSecret) {
  const keys = crypto.getKeys(secret)

  const transaction = {
    type: trsType,
    nethash: options.get('nethash'),
    amount: assetInfo.amount ? `${assetInfo.amount}` : '0',
    fee: '',
    recipientId: assetInfo.recipientId ? assetInfo.recipientId : null,
    senderPublicKey: keys.publicKey,
    timestamp: slots.getTime() - options.get('clientDriftSeconds'),
    message: assetInfo.message ? `${assetInfo.message}` : null,
    asset: {}
  }

  // 整理 amount，recipientId，message 字段
  delete assetInfo.amount
  delete assetInfo.recipientId
  delete assetInfo.message

  // 整理资产自己的数量
  if (assetInfo.aobAmount) {
    assetInfo.amount = assetInfo.aobAmount
    delete assetInfo.aobAmount
  }

  const assetJsonName = Asset.Utils.getAssetJsonName(trsType)
  transaction.asset[assetJsonName] = assetInfo

  // 计算资产费用
  // fixme: 这里的 fee 应该与对应的 trsType 对应，不然就是默认 send 交易费用
  // const fee = assetInfo.fee || constants.net.fees.send;
  // delete assetInfo.fee;
  if (assetInfo.fee) {
    transaction.fee = assetInfo.fee
    delete assetInfo.fee
  } else {
    transaction.fee = await crypto.getFee(transaction)
  }

  transaction.signature = await crypto.sign(transaction, keys)

  if (secondSecret) {
    const secondKeys = crypto.getKeys(secondSecret)
    transaction.sign_signature = await crypto.secondSign(transaction, secondKeys)
  }

  transaction.id = await crypto.getId(transaction)

  return transaction
}

export default {
  createPluginAsset
}
