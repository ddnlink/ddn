import { generateDapp } from '../../plugins/generator'

module.exports = {
  command: 'dapp <name>',
  aliases: 'd',
  desc: 'Create an empty dapp from template.',
  builder: {},

  handler: function (argv) {
    generateDapp(argv.name)
  }
}
