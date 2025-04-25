import { init, peerStat } from '../../plugins/peer'

module.exports = {
  command: 'stat',
  aliases: 's',
  desc: 'Analyze peer stats of all peers',
  builder: {},

  handler: function (argv) {
    init(argv)
    peerStat(argv)
  }
}
