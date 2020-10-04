import { init, getBlockStatus } from '../../plugins/api'

module.exports = {
  command: 'getBlockStatus',
  aliases: ['gbs', 'status'],
  desc: 'Get block status',
  builder: {},

  handler: function (argv) {
    init(argv)
    getBlockStatus(argv)
  }
}
