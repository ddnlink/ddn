module.exports = {
  command: 'blockchain [command]',
  aliases: ['block', 'chain'],
  desc: 'Manage blockchain',
  builder: function (yargs) {
    return yargs.commandDir('blockchain')
  },

  handler: function (argv) {
    console.log('Hi, please select a command, e.g: getHeight,  --help')
  }
}
