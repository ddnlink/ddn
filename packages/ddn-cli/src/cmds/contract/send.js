import { init, sendContract } from '../../plugins/api'

module.exports = {
  command: 'send',
  aliases: 's',
  desc: 'Call the not readonly or payable method of a contract',
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
    gas: {
      alias: 'g',
      describe: 'gas limit'
    },
    method: {
      alias: 'm',
      describe: 'contract method'
    },
    args: {
      alias: 'v',
      describe: 'contract method args, should be array'
    }
  },

  handler: function (argv) {
    init(argv)
    sendContract(argv)
  }
}
