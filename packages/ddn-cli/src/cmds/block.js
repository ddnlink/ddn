module.exports = {
  command: 'block [command]',
  aliases: ['b', 'block', 'chain'],
  desc: 'DDN block manage tools.',
  builder: function (yargs) {
    return yargs.commandDir('block')
  },

  handler: function (argv) {
    console.log('Hi, please select a command, e.g: getHeight,  --help')
  }
}
