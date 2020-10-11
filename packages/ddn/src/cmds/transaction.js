module.exports = {
  command: 'transaction [command]',
  aliases: ['t', 'trs'],
  desc: 'DDN transaction manage tools.',
  builder: function (yargs) {
    return yargs.commandDir('transaction')
  },

  handler: function (argv) {
    console.log('Hi, please select a command, e.g: getTransaction,  --help')
  }
}
