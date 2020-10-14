import { genUsers } from '../../plugins/users'

module.exports = {
  command: 'users',
  aliases: 'u',
  desc: 'Create some accounts to a file.',
  builder: {
    tokenPrefix: {
      alias: 'p',
      describe: 'Prefix of token.',
      default: 'D'
    },
    tokenName: {
      alias: 't',
      describe: 'Name of token.',
      default: 'DDN'
    }
  },

  handler: function (argv) {
    genUsers(argv)
  }
}
