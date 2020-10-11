
import yargs from 'yargs'

yargs
  .commandDir('cmds')
  .demandCommand()
  .options({
    host: {
      alias: 'H',
      describe: 'Specify the hostname or ip of the node',
      default: process.env.DDN_HOST || '127.0.0.1'
    },
    port: {
      alias: 'P',
      describe: 'Specify the port of the node',
      default: process.env.DDN_PORT || 8001
    },

    main: {
      alias: 'M',
      describe: 'Specify the mainnet, default: false'
      // default: false
    }
  })
  .help()
  .alias('h', 'help')
  .epilog('copyright 2020')
  .argv
