var wrk = require('wrk');
var node = require('../../../variables.js')

function createTransfer(address, amount, secret) {
  return node.ddn.transaction.createTransaction(address, amount, "credible", secret)
}
var transaction = createTransfer("ECyhBC44N3VGop5ZkTViS5kT3AYoSwjkjo", 100000000, node.Gaccount.password);

wrk({
  threads: 1,
  connections: 10,
  duration: '10s',
  printLatency: true,

  script: 'post.lua',
  // {
  //   method: 'POST',
  //   body: {
  //     transaction: transaction
  //   }
  // },

  headers: {
    'version': "testnet",
    'port': 8001,
    'nethash': "fl6ybowg",
    'os': ''
  },
  url: 'http://localhost:8001/peer/transactions',

}, function (err, out) {
  // results.push(out);
  if (err) {
    console.log(err)
  }
  console.log(out);
});

