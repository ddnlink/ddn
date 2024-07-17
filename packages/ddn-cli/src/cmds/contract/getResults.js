import { init, getContractResults } from '../../plugins/api'

module.exports = {
  command: 'results [id]',
  aliases: 'rs',
  desc: 'Get contract results list',
  builder: {},

  handler: function (argv) {
    init(argv)
    getContractResults(argv)
  }
}
