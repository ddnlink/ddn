import { init, registerDapp } from '../../plugins/api'

module.exports = {
  command: 'regist',
  aliases: 'r',
  desc: 'Regist dapp to blockchain',
  builder: {
    secret: {
      alias: 'e',
      describe: 'Secret'
      // default: 'demo'
    },

    secondSecret: {
      alias: 's',
      describe: 'Second secret'
      // choices: ['xs', 's', 'm', 'l', 'xl']
    },

    metafile: {
      alias: 'f',
      describe: 'dapp meta file',
      demandOption: false
    }
  },

  handler: function (argv) {
    init(argv)
    registerDapp(argv)
  }
}
