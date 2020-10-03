module.exports = {
  command: 'account [command]',
  aliases: ['A'],
  desc: 'DDN account manage tools.',
  builder: function (yargs) {
    return yargs.commandDir('account')
  },

  handler: function (argv) {
    console.log('Hi, please select a command, e.g: peerStat,  --help')
  }
}
