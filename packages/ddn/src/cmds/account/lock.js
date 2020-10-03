import { init, lock } from '../../plugins/api'

module.exports = {
  command: 'lock',
  aliases: 'L',
  desc: 'Lock account to ban transfer ...',
  builder: {
    secret: {
      alias: 'e',
      describe: 'secret'
    },
    secondSecret: {
      alias: 's',
      describe: 'secondSecret'
    },
    height: {
      alias: 'h',
      describe: 'lock height'
    }
  },

  handler: function (argv) {
    init(argv)
    lock(argv)
  }
}
