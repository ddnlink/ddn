import { init, getContractMetadata } from '../../plugins/api'

module.exports = {
  command: 'meta [id]',
  aliases: 'm',
  desc: 'Get contract metadata by id',
  builder: {},

  handler: function (argv) {
    init(argv)
    getContractMetadata(argv.id)
  }
}
