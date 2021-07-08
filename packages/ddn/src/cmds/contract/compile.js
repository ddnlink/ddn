import { init, compileContract } from '../../plugins/api'

module.exports = {
  command: 'compile',
  aliases: 'c',
  desc: 'Compile a contract',
  builder: {
    file: {
      alias: 'f',
      describe: 'code file'
    },
    code: {
      alias: 'c',
      describe: 'code body'
    }
  },

  handler: function (argv) {
    init(argv)
    compileContract(argv)
  }
}
