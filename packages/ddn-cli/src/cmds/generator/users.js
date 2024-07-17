import { genUsers } from '../../plugins/users'

module.exports = {
  command: 'users',
  aliases: 'u',
  desc: 'Create some accounts to a file.',
  builder: {
    tokenPrefix: {
      alias: 'p',
      describe: 'Prefix of token.',
      default: 'D'
    },
    tokenName: {
      alias: 't',
      describe: 'Name of token.',
      default: 'DDN'
    },
    totalAmount: {
      alias: 'a',
      describe: 'Total amount of token.',
      default: '100000000' // 1亿
    },
    count: {
      alias: 'c',
      describe: 'Count of usrs.',
      default: '100' // 100个账户
    },
    one: {
      alias: 'o',
      describe: 'One user of users.',
      default: '5000000' // 50万，其他平均分配
    }
  },

  handler: function (argv) {
    genUsers(argv)
  }
}
