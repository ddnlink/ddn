import { init, openAccountByPublicKey } from '../../plugins/api'

module.exports = {
  command: 'openAccountByPublicKey [publickey]',
  aliases: 'oabp',
  desc: 'Open your account and get the infomation by publickey',
  builder: {},

  handler: function (argv) {
    init(argv)
    openAccountByPublicKey(argv.publickey)
  }
}
