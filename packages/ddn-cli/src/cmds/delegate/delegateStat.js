import { init, delegateStat } from '../../plugins/delegate'

module.exports = {
  command: 'delegateStat',
  aliases: 'ds',
  desc: 'Analyze delegates status',
  builder: {},

  handler: function (argv) {
    init(argv)
    delegateStat(argv)
  }
}
