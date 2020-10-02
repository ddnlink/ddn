module.exports = {
  command: 'dapp [command]',
  desc: 'Manage dapps',
  builder: function (yargs) {
    return yargs.commandDir('dapp')
  },

  handler: function (argv) {
    console.log('Hi, please select a command, e.g: new, install, --help')
  }
}
