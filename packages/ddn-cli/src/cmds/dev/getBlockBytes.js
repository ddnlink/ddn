import { init, getBlockBytes } from '../../plugins/api'

module.exports = {
  command: 'getBlockBytes',
  aliases: 'gbb',
  desc: 'Get block bytes',
  builder: {
    file: {
      alias: 'f',
      describe: 'block file'
    }
  },

  handler: function (argv) {
    init(argv)
    getBlockBytes(argv)
  }
}
