import { init, getDelegatesCount } from '../../plugins/api'

module.exports = {
  command: 'getDelegatesCount',
  aliases: 'gdc',
  desc: 'Get delegates count',
  builder: {},

  handler: function (argv) {
    init(argv)
    getDelegatesCount()
  }
}
