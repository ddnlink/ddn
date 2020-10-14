import { generateDapp } from '../../plugins/generator'

module.exports = {
  command: 'generate <name>',
  aliases: 'g',
  desc: 'Create an empty dapp from template',
  builder: {},

  handler: function (argv) {
    generateDapp(argv.name)
  }
}
