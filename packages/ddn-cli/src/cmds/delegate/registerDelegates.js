import { init, registerDelegates } from '../../plugins/delegate'

module.exports = {
  command: 'registerDelegates',
  aliases: 'rds',
  desc: 'Register many delegates',
  builder: {
    file: {
      alias: 'f',
      describe: 'Accounts file, e.g: teams.json'
    }
  },

  handler: function (argv) {
    init(argv)
    registerDelegates(argv)
  }
}
