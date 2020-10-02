import { createGenesisBlock } from '../../plugins/dapp'

module.exports = {
  command: 'newGenesis',
  aliases: 'g',
  desc: 'Create dapp genesis block',
  builder: {},

  handler: function (argv) {
    createGenesisBlock()
  }
}
