import { init, getBlocks } from '../../plugins/api'

module.exports = {
  command: 'getBlocks',
  aliases: ['gbl', 'blocks'],
  desc: 'Get blocks list',
  builder: {
    offset: {
      alias: 'o',
      describe: 'Offset'
    },
    limit: {
      alias: 'l',
      describe: 'Limit'
    },
    reward: {
      alias: 'r',
      describe: 'Reward'
    },
    totalFee: {
      alias: 'f',
      describe: 'totalFee'
    },
    totalAmount: {
      alias: 'a',
      describe: 'totalAmount'
    },
    generatorPublicKey: {
      alias: 'g',
      describe: 'generatorPublicKey'
    },
    sort: {
      alias: 's',
      describe: 'height:asc, totalAmount:asc, totalFee:asc'
    }
  },

  handler: function (argv) {
    init(argv)
    getBlocks(argv)
  }
}
