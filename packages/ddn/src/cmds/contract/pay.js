import { init, payContract } from '../../plugins/api'

module.exports = {
  command: 'pay',
  aliases: 'p',
  desc: 'Pay token to some contract',
  builder: {
    secret: {
      alias: 'e',
      describe: 'secret'
    },
    secondSecret: {
      alias: 's',
      describe: 'secondSecret'
    },
    id: {
      alias: 'i',
      describe: 'contract id'
    },
    method: {
      alias: 'm',
      describe: 'contract payable method'
    },
    args: {
      alias: 'v',
      describe: 'contract payable method args, should be array'
    },
    gas: {
      alias: 'g',
      describe: 'gas limit'
    },
    amount: {
      alias: 'a',
      describe: 'amount to pay'
    },
    currency: {
      alias: 'c',
      describe: 'token type'
    }
  },

  handler: function (argv) {
    init(argv)
    payContract(argv)
  }
}
