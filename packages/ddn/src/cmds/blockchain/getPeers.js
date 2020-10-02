import { init, getPeers } from '../../plugins/api'

module.exports = {
  command: 'getPeers',
  aliases: 'peers',
  desc: 'Get peers list',
  builder: {
    offset: {
      alias: 'o',
      describe: 'Offset'
    },
    limit: {
      alias: 'l',
      describe: 'Limit'
    },
    state: {
      alias: 't',
      describe: 'State'
    },
    version: {
      alias: 'v',
      describe: 'version'
    },
    port: {
      alias: 'p',
      describe: 'port'
    },
    os: {
      describe: 'os'
    },
    sort: {
      alias: 's',
      describe: 'port:asc ...'
    }
  },

  handler: function (argv) {
    init(argv)
    getPeers(argv)
  }
}
