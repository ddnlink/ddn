// 批量转账
import { init, sendTokens } from '../../plugins/transaction'

module.exports = {
  command: 'sendTokens',
  aliases: 'sts',
  desc: 'Send tokens to many addresss',
  builder: {
    secret: {
      alias: 'e',
      describe: 'secret'
    },
    secondSecret: {
      alias: 's',
      describe: 'secondSecret'
    },
    file: {
      alias: 'f',
      describe: 'genesis accounts balance file, e.g: teams.txt'
    }
  },

  handler: function (argv) {
    init(argv)
    sendTokens(argv)
  }
}
