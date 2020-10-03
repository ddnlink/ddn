const y18n = require('y18n')
const __ = y18n().__

module.exports = {
  command: 'dapp [command]',
  desc: 'Manage dapps',
  builder: function (yargs) {
    return yargs.commandDir('dapp')
  },

  handler: function (argv) {
    console.log(__('Hi, please select a command, e.g: new, install, --help'))
  }
}
