var node = require('../../../variables.js')

function createTransfer(address, amount, secret) {
  return node.ddn.transaction.createTransaction(address, amount, "credible", secret)
}

module.exports = {
  setJSONBody: setJSONBody,
  logHeaders: logHeaders
}

let count = 0;

function setJSONBody(req, context, ee, next) {
  var transaction = createTransfer("ECyhBC44N3VGop5ZkTViS5kT3AYoSwjkjo", 100000000 + count, node.Gaccount.password);
  count++
  // console.log(count + " transaction= ", transaction);

  req.method = "post"

  req.json = {
    transaction: transaction
  }

  req.headers = {
    'version': "testnet",
    'port': 8001,
    'nethash': "fl6ybowg",
    'os': ''
  }

  // console.log("req= ", req);

  return next(); // MUST be called for the scenario to continue
}

function logHeaders(req, response, context, ee, next) {
  console.log(response.body);
  return next(); // MUST be called for the scenario to continue
}
