import { init, getDelegateByUsername } from '../../plugins/delegate'

module.exports = {
  command: 'getDelegateByUsername [username]',
  aliases: 'gdbu',
  desc: 'Get delegate by username',
  builder: {},

  handler: function (argv) {
    init(argv)
    getDelegateByUsername(argv.username)
  }
}
