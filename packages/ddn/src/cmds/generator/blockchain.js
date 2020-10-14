import { generateBlockchain } from '../../plugins/generator'

module.exports = {
  command: 'blockchain <name>',
  aliases: 'b',
  desc: 'Generate new blockchain.',
  builder: {

  },

  handler: function (argv) {
    generateBlockchain(argv.name)
  }
}
