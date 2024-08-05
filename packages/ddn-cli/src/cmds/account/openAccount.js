import { init, openAccount } from '../../plugins/api'

module.exports = {
  command: 'openAccount [secret]',
  aliases: ['o', 'open'],
  desc: 'Open your account and get the infomation by secret',
  builder: {},

  handler: function (argv) {
    init(argv)
    openAccount(argv.secret)
  }
}
