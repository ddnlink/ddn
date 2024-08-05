import { init, getDelegateByUsername } from '../../plugins/api'

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
