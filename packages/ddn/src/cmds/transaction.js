module.exports = {
  command: 'transaction [command]',
  aliases: ['T', 'trs'],
  desc: 'Manage transaction tools.',
  builder: function (yargs) {
    return yargs.commandDir('transaction')
  },

  handler: function (argv) {
    console.log('Hi, please select a command, e.g: getTransaction,  --help')
  }
}
