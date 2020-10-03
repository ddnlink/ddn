import { init, getFullBlockByHeight } from '../../plugins/api'

module.exports = {
  command: 'getFullBlockByHeight [height]',
  aliases: 'GFBBH',
  desc: 'Get full block by block height',
  builder: {},

  handler: function (argv) {
    init(argv)
    getFullBlockByHeight(argv.height)
  }
}
