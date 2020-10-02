import { generateDapp } from '../../plugins/dapp/generate'

module.exports = {
  command: 'new [name]',
  aliases: 'n',
  desc: 'Create an empty dapp from template',
  builder: {
    name: {
      default: 'demo'
    }
  },

  handler: function (argv) {
    generateDapp(argv.name)
  }
}
