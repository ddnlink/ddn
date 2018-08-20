var optionMap = {
  clientDriftSeconds: 5,
  nethash: '1d6f46cj', //fl6ybowg 0ab796cd default ddn testnet. EOK mainnet: 315by9uk, testnet: fl6ybowg   CCS testnet: 1d6f46cj
}

module.exports = {
  set: function (key, val) {
    optionMap[key] = val
  },
  get: function (key) {
    return optionMap[key]
  },
  getAll: function () {
    return optionMap
  }
}