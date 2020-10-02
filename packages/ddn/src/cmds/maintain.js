module.exports = {
  command: 'maintain [command]',
  desc: 'DDN maintain tools.',
  builder: function (yargs) {
    return yargs.commandDir('maintain')
  },

  handler: function (argv) {
    console.log('Hi, please select a command, e.g: peerStat,  --help')
  }
}
