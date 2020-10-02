import { withdrawalDapp } from '../../plugins/dapp'

module.exports = {
  command: 'withdrawal',
  aliases: 'w',
  desc: 'Withdrawal funds to dapp',
  builder: {},

  handler: function (argv) {
    withdrawalDapp()
  }
}
