module.exports = {
  command: 'generate [command]',
  aliases: 'g',
  desc: 'DDN generate tools.',
  builder: function (yargs) {
    return yargs.commandDir('generator')
  },

  handler: function (argv) {
    console.log('Hi, please select a command, e.g: ddn g blockchain,  --help')
  }
}
