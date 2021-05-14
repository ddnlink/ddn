import { genGenesisBlock } from '../../plugins/generator'

module.exports = {
  command: 'genesisBlock',
  aliases: 'gb',
  desc: 'Generate new genesis block.',
  builder: {
    file: {
      alias: 'f',
      describe: 'genesis accounts balance file'
    },
    secret: {
      alias: 's',
      describe: 'genesisAccount`s secret, default is the DDN`s testnet secret'
    },
    nethash: {
      alias: 'n',
      describe: 'Default to generate a new nethash'
    },
    tokenPrefix: {
      alias: 'p',
      describe: 'Prefix of token.',
      default: 'D'
    },
    tokenName: {
      alias: 't',
      describe: 'Name of token.',
      default: 'DDN'
    },
    genesisBlockName: {
      alias: 'g',
      describe: 'Genesis block file name',
      default: 'genesisBlock'
    },
    message: {
      alias: 'm',
      describe: 'message'
    },
    count: {
      alias: 'c',
      describe: 'secret count',
      default: 101
    }
  },

  handler: function (argv) {
    console.log(argv)
    genGenesisBlock(argv)
  }
}
