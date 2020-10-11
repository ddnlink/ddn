import { installDapp } from '../../plugins/dapp'

module.exports = {
  command: 'install',
  aliases: 'i',
  desc: 'Install dapp',
  builder: {},

  handler: function (argv) {
    installDapp()
  }
}
