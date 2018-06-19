var optionMap = {
  clientDriftSeconds: 5,
  nethash: 'fl6ybowg', //fl6ybowg 0ab796cd default ddn testnet. EOK mainnet: 315by9uk, testnet: fl6ybowg   
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