import { init, getVotedDelegates } from '../../plugins/api'

module.exports = {
  command: 'getVotedDelegates [address]',
  aliases: 'gvd',
  desc: 'Get delegates voted by address',
  builder: {
    offset: {
      alias: 'o',
      describe: 'Offset'
      // default: ''
    },
    limit: {
      alias: 'l',
      describe: 'Limit'
      // default: ''
    }
  },

  handler: function (argv) {
    init(argv)
    getVotedDelegates(argv.address, argv)
  }
}
