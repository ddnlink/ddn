import { init, publishContract } from '../../plugins/api'

module.exports = {
  command: 'publish',
  aliases: 'p',
  desc: 'publish a smart contract',
  builder: {
    secret: {
      alias: 'e',
      describe: 'secret'
    },
    secondSecret: {
      alias: 's',
      describe: 'secondSecret'
    },
    name: {
      alias: 'n',
      describe: 'contract name'
    },
    desc: {
      alias: 'd',
      describe: 'contract description'
    },
    gas: {
      alias: 'g',
      describe: 'contract gas limit'
    },
    file: {
      alias: 'f',
      describe: 'code file'
    },
    code: {
      alias: 'c',
      describe: 'code body'
    },
    ver: {
      alias: 'v',
      describe: 'contract code ver'
    }
  },

  handler: function (argv) {
    init(argv)
    publishContract(argv)
  }
}
