import { init, transferContract } from '../../plugins/api'

module.exports = {
  command: 'transfer',
  aliases: 't',
  desc: 'Send token to some contract',
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
    currency: {
      alias: 'c',
      describe: 'amount'
    },
    address: {
      alias: 'd',
      describe: 'to address'
    },
    method: {
      alias: 'm',
      describe: 'contract method'
    },
    gas: {
      alias: 'g',
      describe: 'gas limit'
    }
  },

  handler: function (argv) {
    init(argv)
    transferContract(argv)
  }
}
