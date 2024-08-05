import { createGenesisBlock } from '../../plugins/dapp'

module.exports = {
  command: 'genesisBlock',
  aliases: 'gb',
  desc: 'Create dapp genesis block',
  builder: {},

  handler: function (argv) {
    createGenesisBlock()
  }
}
