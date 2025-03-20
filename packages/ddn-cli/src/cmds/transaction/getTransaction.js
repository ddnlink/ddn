import { init, getTransaction } from '../../plugins/transaction'

module.exports = {
  command: 'getTransaction [id]',
  aliases: 'gt',
  desc: 'Get transaction by id',
  builder: {},

  handler: function (argv) {
    init(argv)
    getTransaction(argv.id)
  }
}
