import { init, peerStat } from '../../plugins/maintain'

module.exports = {
  command: 'peerStat',
  aliases: 'PStat',
  desc: 'Analyze block height of all peers',
  builder: {},

  handler: function (argv) {
    init(argv)
    peerStat(argv)
  }
}
