import { init, getBalance } from '../../plugins/api'

module.exports = {
  command: 'getBalance [address]',
  aliases: 'balance',
  desc: 'Get balance by address',
  builder: {},

  handler: function (argv) {
    init(argv)
    getBalance(argv.address)
  }
}
