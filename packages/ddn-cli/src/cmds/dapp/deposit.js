import { depositDapp } from '../../plugins/dapp'
import { init } from '../../plugins/api'

module.exports = {
  command: 'deposit',
  aliases: 'd',
  desc: 'Deposit funds to dapp',
  builder: {},

  handler: function (argv) {
    init(argv)
    depositDapp()
  }
}
