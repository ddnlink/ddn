
async function getAsset (transaction) {
  if (global.assets && global.assets.transTypeNames[transaction.type]) {
    const trans = global.assets.transTypeNames[transaction.type]

    const trsName = getAssetName(trans.name)
    const asset = transaction.asset[trsName]
    return { trsName, asset }
  }
  return {}
}

function getAssetName (trsName) {
  let result = ''
  const subNames = trsName.split(/[-_]/)
  for (let i = 0; i < subNames.length; i++) {
    const sn = subNames[i]
    if (sn && !/^\s*$/.test(sn)) {
      if (i === 0) {
        const camelSN = sn.substring(0, 1).toLowerCase() + sn.substring(1)
        result += camelSN
      } else {
        const camelSN = sn.substring(0, 1).toUpperCase() + sn.substring(1)
        result += camelSN
      }
    }
  }
  return result
}

export {
  getAsset,
  getAssetName
}
