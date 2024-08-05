import { init, getContractCode } from '../../plugins/api'

module.exports = {
  command: 'code [id]',
  aliases: 'cc',
  desc: 'Get contract code by id',
  builder: {},

  handler: function (argv) {
    init(argv)
    getContractCode(argv.id)
  }
}
