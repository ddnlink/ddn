module.exports = {
  command: 'crypto [command]',
  aliases: 'cry',
  desc: 'set crypto for ddn cli',
  builder: function (yargs) {
    return yargs.commandDir('setCrypto')
  },

  handler: function (argv) {
    console.log('Hi, please select a command, e.g: new,  --help')
  }
}
