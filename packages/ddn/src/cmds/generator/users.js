import { genUsers } from '../../plugins/users'

module.exports = {
  command: 'users',
  aliases: 'u',
  desc: 'Create some accounts to a file.',
  builder: {},

  handler: function (argv) {
    genUsers(argv.name)
  }
}
