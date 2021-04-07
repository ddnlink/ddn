import { init, getContract } from '../../plugins/api'

module.exports = {
  command: 'getContract [id]',
  aliases: 'gt',
  desc: 'Get contract by id or address',
  builder: {},

  handler: function (argv) {
    init(argv)
    getContract(argv.id)
  }
}
