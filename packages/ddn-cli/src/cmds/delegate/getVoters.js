import { init, getVoters } from '../../plugins/delegate'

module.exports = {
  command: 'getVoters [publicKey]',
  aliases: ['gv', 'voters'],
  desc: 'Get voters of a delegate by public key',
  builder: {},

  handler: function (argv) {
    init(argv)
    getVoters(argv.publicKey)
  }
}
