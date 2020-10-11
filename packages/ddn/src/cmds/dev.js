module.exports = {
  command: 'dev [command]',
  desc: 'DDN develop tools.',
  builder: function (yargs) {
    return yargs.commandDir('dev')
  },

  handler: function (argv) {
    console.log('Hi, please select a command, e.g: new,  --help')
  }
}
