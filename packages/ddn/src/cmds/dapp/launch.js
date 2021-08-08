import { launchDapp } from '../../plugins/dapp'

module.exports = {
  command: 'launch',
  aliases: 'l',
  desc: 'launch dapp',
  builder: {},

  handler: function (argv) {
    launchDapp()
  }
}
