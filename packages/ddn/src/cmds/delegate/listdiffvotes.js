import { init, listdiffvotes } from '../../plugins/api'

module.exports = {
  command: 'listdiffvotes',
  aliases: 'ldv',
  desc: 'List all you voted but doesn`t vote you and voted you but you don`t vote.',
  builder: {
    username: {
      alias: 'u',
      describe: 'username'
    }
  },

  handler: function (argv) {
    init(argv)
    listdiffvotes(argv)
  }
}
