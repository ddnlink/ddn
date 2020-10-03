import { init, getDelegateByUsername } from '../../plugins/api'

module.exports = {
  command: 'getDelegateByUsername [username]',
  aliases: 'DByU',
  desc: 'Get delegate by username',
  builder: {},

  handler: function (argv) {
    init(argv)
    getDelegateByUsername(argv.username)
  }
}
