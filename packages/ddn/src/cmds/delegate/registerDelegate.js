import { init, registerDelegate } from '../../plugins/api'

module.exports = {
  command: 'registerDelegate',
  aliases: 'RD',
  desc: 'Register delegate',
  builder: {
    secret: {
      alias: 'e',
      describe: 'secret'
    },
    secondSecret: {
      alias: 's',
      describe: 'secondSecret'
    },
    username: {
      alias: 'u',
      describe: 'username'
    }
  },

  handler: function (argv) {
    init(argv)
    registerDelegate(argv)
  }
}
