import { init, sendToken } from '../../plugins/api'

module.exports = {
  command: 'sendToken',
  aliases: 'st',
  desc: 'Send token to some address',
  builder: {
    secret: {
      alias: 'e',
      describe: 'secret'
    },
    secondSecret: {
      alias: 's',
      describe: 'secondSecret'
    },
    amount: {
      alias: 'a',
      describe: 'amount'
    },
    to: {
      alias: 't',
      describe: 'to address'
    },
    message: {
      alias: 'm',
      describe: 'message'
    },
    nethash: {
      alias: 'n',
      describe: 'nethash',
      default: '0ab796cd' // DDN testnet
    }
  },

  handler: function (argv) {
    init(argv)
    sendToken(argv)
  }
}
