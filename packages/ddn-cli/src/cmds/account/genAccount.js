import { genAccount } from '../../plugins/account'

module.exports = {
  command: 'genAccount',
  aliases: ['ga'],
  desc: 'Generate random accounts',
  builder: {},

  handler: function (argv) {
    genAccount(argv.secret)
  }
}
