import { init, upvotes } from '../../plugins/delegate'

module.exports = {
  command: 'upvotes',
  aliases: 'uvs',
  desc: 'Votes for many delegates',
  builder: {
    secret: {
      alias: 'e',
      describe: 'Voter`s secret'
    },
    secondSecret: {
      alias: 's',
      describe: 'Voter`s secondSecret'
    },
    file: {
      alias: 'f',
      describe: 'Accounts file, e.g: teams.json'
    }
  },

  handler: function (argv) {
    init(argv)
    upvotes(argv)
  }
}
