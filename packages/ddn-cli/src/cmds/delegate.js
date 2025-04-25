module.exports = {
  command: 'delegate [command]',
  aliases: ['d'],
  desc: 'DDN delegate manage tools.',
  builder: function (yargs) {
    return yargs.commandDir('delegate')
  },

  handler: function (argv) {
    console.log('Hi, please select a command, e.g: delegateStat, --help')
  }
}
