module.exports = {
  command: 'block [command]',
  aliases: ['B', 'block', 'chain'],
  desc: 'Manage block tools',
  builder: function (yargs) {
    return yargs.commandDir('block')
  },

  handler: function (argv) {
    console.log('Hi, please select a command, e.g: getHeight,  --help')
  }
}
