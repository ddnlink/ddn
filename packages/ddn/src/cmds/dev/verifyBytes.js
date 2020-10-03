import { init, verifyBytes } from '../../plugins/api'

module.exports = {
  command: 'verifyBytes',
  aliases: 'VB',
  desc: 'Verify bytes/signature/publickey',
  builder: {
    bytes: {
      alias: 'b',
      describe: 'transaction or block bytes'
    },
    signature: {
      alias: 's',
      describe: 'transaction or block signature'
    },
    publicKey: {
      alias: 'p',
      describe: 'signer public key'
    }
  },

  handler: function (argv) {
    init(argv)
    verifyBytes(argv)
  }
}
