import { init, executeContract } from '../../plugins/api'

module.exports = {
  command: 'execute',
  aliases: 'x',
  desc: 'execute a contract method',
  builder: {
    secret: {
      alias: 'e',
      describe: 'secret'
    },
    secondSecret: {
      alias: 's',
      describe: 'secondSecret'
    },
    address: {
      alias: 'a',
      describe: 'contract address'
    },
    gas: {
      alias: 'g',
      describe: 'gas limit'
    },
    method: {
      alias: 'm',
      describe: 'the contract method to execute'
    },
    args: {
      alias: 'v',
      describe: 'params pass to the contract method'
    }
  },

  handler: function (argv) {
    init(argv)
    executeContract(argv)
  }
}
