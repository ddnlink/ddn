import { init, downvote } from '../../plugins/api'

module.exports = {
  command: 'downvote',
  aliases: 'dv',
  desc: 'Cancel vote for delegates',
  builder: {
    secret: {
      alias: 'e',
      describe: 'secret'
    },
    secondSecret: {
      alias: 's',
      describe: 'secondSecret'
    },
    publicKeys: {
      alias: 'p',
      describe: 'publicKey list'
    }
  },

  handler: function (argv) {
    init(argv)
    downvote(argv)
  }
}
