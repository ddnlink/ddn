import { uninstallDapp } from '../../plugins/dapp'

module.exports = {
  command: 'uninstall',
  aliases: 'u',
  desc: 'Uninstall dapp',
  builder: {},

  handler: function (argv) {
    uninstallDapp()
  }
}
