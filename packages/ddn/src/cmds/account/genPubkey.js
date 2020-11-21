import { genPubkey } from '../../plugins/account'

module.exports = {
  command: 'genPubkey',
  aliases: ['gpk'],
  desc: 'Generate public key from secret',
  builder: {},

  handler: function (argv) {
    genPubkey(argv.secret)
  }
}
