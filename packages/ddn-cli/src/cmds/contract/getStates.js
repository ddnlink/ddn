import { init, getContractStates } from '../../plugins/api'

module.exports = {
  command: 'states',
  aliases: 'st',
  desc: 'Get contract states',
  builder: {
    id: {
      alias: 'i',
      describe: 'contract id'
    },
    path: {
      alias: 'p',
      describe: 'state path'
    }
  },

  handler: function (argv) {
    init(argv)
    getContractStates(argv)
  }
}
