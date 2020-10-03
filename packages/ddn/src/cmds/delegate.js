module.exports = {
  command: 'delegate [command]',
  aliases: ['D'],
  desc: 'DDN delegate manage tools.',
  builder: function (yargs) {
    return yargs.commandDir('delegate')
  },

  handler: function (argv) {
    console.log('Hi, please select a command, e.g: peerStat,  --help')
  }
}
