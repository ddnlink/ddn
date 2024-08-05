import { init, callContract } from '../../plugins/api'

module.exports = {
  command: 'call',
  aliases: 'x',
  desc: 'call a contract readonly method',
  builder: {
    id: {
      alias: 'i',
      describe: 'contract id'
    },
    method: {
      alias: 'm',
      describe: 'the contract constant method to call'
    },
    args: {
      alias: 'v',
      describe: 'params pass to the contract method, should be array'
    }
  },

  handler: function (argv) {
    init(argv)
    callContract(argv)
  }
}
