import { init, getContracts } from '../../plugins/api'

module.exports = {
  command: 'all',
  aliases: 'a',
  desc: 'Get contracts list',
  builder: {
    offset: {
      alias: 'o',
      describe: 'Offset'
    },
    limit: {
      alias: 'l',
      describe: 'Limit'
    },
    // sort
    orderBy: {
      alias: 's',
      describe: 'sort, e.g: fee:desc ...'
    },
    blockId: {
      alias: 'b',
      describe: 'block id'
    },
    tid: {
      alias: 't',
      describe: 'block id'
    },
    name: {
      alias: 'n',
      describe: 'name'
    },
    owner: {
      alias: 'w',
      describe: 'senderId'
    }
  },

  handler: function (argv) {
    init(argv)
    getContracts(argv)
  }
}
