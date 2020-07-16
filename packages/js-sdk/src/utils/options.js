const optionMap = {
  clientDriftSeconds: 5,
  nethash: '0ab796cd', // fl6ybowg 0ab796cd default ddn testnet. EOK mainnet: 315by9uk, testnet: fl6ybowg   CCS testnet: 1d6f46cj
  net: 'testnet' // 默认为 testnet
}

export default {
  set (key, val) {
    optionMap[key] = val
  },
  get (key) {
    return optionMap[key]
  },
  getAll () {
    return optionMap
  }
}
