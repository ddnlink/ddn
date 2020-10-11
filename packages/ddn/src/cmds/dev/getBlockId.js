import { init, getBlockId } from '../../plugins/api'

module.exports = {
  command: 'getBlockId',
  aliases: 'gbi',
  desc: 'Get block id',
  builder: {
    file: {
      alias: 'f',
      describe: 'block file'
    }
  },

  handler: function (argv) {
    init(argv)
    getBlockId(argv)
  }
}
