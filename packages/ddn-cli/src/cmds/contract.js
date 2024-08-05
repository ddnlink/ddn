module.exports = {
  command: 'contract [command]',
  aliases: ['c', 'sc'],
  desc: 'DDN contract manage tools.',
  builder: function (yargs) {
    return yargs.commandDir('contract')
  },

  handler: function (argv) {
    console.log('Hi, please select a command, e.g: getContract,  --help')
  }
}
