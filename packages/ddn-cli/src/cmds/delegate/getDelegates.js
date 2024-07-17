import { init, getDelegates } from '../../plugins/api'

module.exports = {
  command: 'getDelegates',
  aliases: 'gd',
  desc: 'Get delegates list',
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
    },
    sort: {
      alias: 's',
      describe: 'rate:asc, vote:desc, ...'
    }
  },

  handler: function (argv) {
    init(argv)
    getDelegates(argv)
  }
}
