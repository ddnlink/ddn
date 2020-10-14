import { generateContract } from '../../plugins/generator'

module.exports = {
  command: 'contract <name>',
  aliases: 'c',
  desc: 'Generate new contract.',
  builder: {

  },

  handler: function (argv) {
    generateContract(argv.name)
  }
}
