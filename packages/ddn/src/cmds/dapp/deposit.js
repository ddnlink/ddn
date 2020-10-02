import { depositDapp } from '../../plugins/dapp'

module.exports = {
  command: 'deposit',
  aliases: 'd',
  desc: 'Deposit funds to dapp',
  builder: {},

  handler: function (argv) {
    depositDapp()
  }
}
