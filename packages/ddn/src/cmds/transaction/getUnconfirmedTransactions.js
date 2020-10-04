import { init, getUnconfirmedTransactions } from '../../plugins/api'

module.exports = {
  command: 'getUnconfirmedTransactions',
  aliases: 'guts',
  desc: 'Get unconfirmed transactions list',
  builder: {
    key: {
      alias: 'k',
      describe: 'sender public key'
    },
    address: {
      alias: 'a',
      describe: 'address'
    }
  },

  handler: function (argv) {
    init(argv)
    getUnconfirmedTransactions(argv)
  }
}
