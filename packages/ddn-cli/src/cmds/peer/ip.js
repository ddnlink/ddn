// fixme: delete it
import { init, ipStat } from '../../plugins/peer'

module.exports = {
  command: 'ip',
  desc: 'analyze peer ip info',
  builder: {},

  handler: function (argv) {
    console.log('ipStat： ', argv)
    init(argv)
    ipStat(argv)
  }
}
