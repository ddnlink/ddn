import { init, setSecondSecret } from '../../plugins/api'

module.exports = {
  command: 'setSecondSecret',
  aliases: 'SSS',
  desc: 'Set second secret',
  builder: {
    secret: {
      alias: 'e',
      describe: 'secret'
    },
    secondSecret: {
      alias: 's',
      describe: 'secondSecret'
    }
  },

  handler: function (argv) {
    init(argv)
    setSecondSecret(argv)
  }
}
