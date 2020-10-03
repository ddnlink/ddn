import { init, getTransactions } from '../../plugins/api'

module.exports = {
  command: 'getTransactions',
  aliases: 'T',
  desc: 'Get peers list',
  builder: {
    blockId: {
      alias: 'b',
      describe: 'block id'
    },
    offset: {
      alias: 'o',
      describe: 'Offset'
    },
    limit: {
      alias: 'l',
      describe: 'Limit'
    },
    type: {
      alias: 'v',
      describe: 'transaction type'
    },
    // sort
    orderBy: {
      alias: 's',
      describe: 'sort, e.g: fee:desc ...'
    },
    amount: {
      alias: 'a',
      describe: 'amount'
    },
    fee: {
      alias: 'f',
      describe: 'fee'
    },
    message: {
      alias: 'm',
      describe: 'message'
    },
    senderPublicKey: {
      describe: 'senderPublicKey'
    },
    senderId: {
      describe: 'senderId'
    },
    recipientId: {
      describe: 'recipientId'
    }
  },

  handler: function (argv) {
    init(argv)
    getTransactions(argv)
  }
}
