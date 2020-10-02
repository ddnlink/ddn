import { init, getDelegateByPublicKey } from '../../plugins/api'

module.exports = {
  command: 'getDelegateByPublicKey [publickey]',
  aliases: 'DByPk',
  desc: 'Get delegate by public key',
  builder: {},

  handler: function (argv) {
    init(argv)
    getDelegateByPublicKey(argv.publickey)
  }
}
