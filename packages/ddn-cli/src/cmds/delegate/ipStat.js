import { init, ipStat } from '../../plugins/maintain'

module.exports = {
  command: 'ipStat',
  desc: 'analyze peer ip info',
  builder: {},

  handler: function (argv) {
    init(argv)
    ipStat(argv)
  }
}
