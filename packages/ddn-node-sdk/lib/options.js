var optionMap = {
  clientDriftSeconds: 5
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