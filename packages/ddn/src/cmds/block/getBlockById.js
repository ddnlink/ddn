import { init, getBlockById } from '../../plugins/api'

module.exports = {
  command: 'getBlockById [id]',
  aliases: 'gbbi',
  desc: 'Get block by id',
  builder: {},

  handler: function (argv) {
    init(argv)
    getBlockById(argv.id)
  }
}
