import { setCrypto } from '../../plugins/crypto'

module.exports = {
  command: 'setCrypto',
  aliases: 'sc',
  desc: 'set crypto for ddn cli',
  builder: {},

  handler: function (argv) {
    setCrypto(argv.name)
  }
}
