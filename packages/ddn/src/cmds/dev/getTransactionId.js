import { init, getTransactionId } from '../../plugins/api'

module.exports = {
  command: 'getTransactionId',
  aliases: 'GTI',
  desc: 'Get transaction id',
  builder: {
    file: {
      alias: 'f',
      describe: 'transaction file'
    }
  },

  handler: function (argv) {
    init(argv)
    getTransactionId(argv)
  }
}
