import { init, sendAsset } from '../../plugins/api'

module.exports = {
  command: 'sendAsset',
  aliases: 'sa',
  desc: 'Send asset to some address',
  builder: {
    secret: {
      alias: 'e',
      describe: 'secret'
    },
    secondSecret: {
      alias: 's',
      describe: 'secondSecret'
    },
    currency: {
      alias: 'c',
      describe: 'currency'
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
    }
  },

  handler: function (argv) {
    init(argv)
    sendAsset(argv)
  }
}
