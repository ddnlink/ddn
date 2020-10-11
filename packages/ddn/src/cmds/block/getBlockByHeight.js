import { init, getBlockByHeight } from '../../plugins/api'

module.exports = {
  command: 'getBlockByHeight [height]',
  aliases: 'gbbh',
  desc: 'Get block by height',
  builder: {},

  handler: function (argv) {
    init(argv)
    getBlockByHeight(argv.height)
  }
}
