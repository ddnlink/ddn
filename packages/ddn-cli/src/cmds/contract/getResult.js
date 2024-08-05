import { init, getContractResults } from '../../plugins/api'

module.exports = {
  command: 'result',
  aliases: 'r',
  desc: 'Get contract results list',
  builder: {
    id: {
      alias: 'i',
      describe: 'contract id'
    },
    tid: {
      alias: 't',
      describe: 'transaction id'
    }
  },

  handler: function (argv) {
    init(argv)
    getContractResults(argv)
  }
}
