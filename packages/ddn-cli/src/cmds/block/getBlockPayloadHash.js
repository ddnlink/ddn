import { init, getBlockPayloadHash } from '../../plugins/api'

module.exports = {
  command: 'getBlockPayloadHash',
  aliases: 'gbph',
  desc: 'Get block payload hash',
  builder: {
    file: {
      alias: 'f',
      describe: 'block file'
    }
  },

  handler: function (argv) {
    init(argv)
    getBlockPayloadHash(argv)
  }
}
