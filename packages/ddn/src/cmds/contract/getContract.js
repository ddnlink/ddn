import { init, getContract } from '../../plugins/api'

module.exports = {
  command: 'get [id]',
  aliases: 'g',
  desc: 'Get contract by id',
  builder: {},

  handler: function (argv) {
    init(argv)
    getContract(argv.id)
  }
}
