import { init, getAccount } from '../../plugins/api'

module.exports = {
  command: 'getAccount [address]',
  aliases: 'account',
  desc: 'Get account by address',
  builder: {},

  handler: function (argv) {
    init(argv)
    getAccount(argv.address)
  }
}
