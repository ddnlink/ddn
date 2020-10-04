import { init, upvote } from '../../plugins/api'

module.exports = {
  command: 'upvote',
  aliases: 'uv',
  desc: 'Vote for delegates',
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
    upvote(argv)
  }
}
