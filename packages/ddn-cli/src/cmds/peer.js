module.exports = {
  command: 'peer [command]',
  aliases: ['p', 'peer'],
  desc: 'DDN peer manage tools.',
  builder: function (yargs) {
    return yargs.commandDir('peer')
  },

  handler: function (argv) {
    console.log('Hi, please select a command, e.g: peerStat, --help')
  }
}
