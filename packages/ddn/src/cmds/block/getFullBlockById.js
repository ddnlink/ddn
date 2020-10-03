import { init, getFullBlockById } from '../../plugins/api'

module.exports = {
  command: 'getFullBlockById [id]',
  aliases: 'GFBBI',
  desc: 'Get full block by block id',
  builder: {},

  handler: function (argv) {
    init(argv)
    getFullBlockById(argv.id)
  }
}
