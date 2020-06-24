
import program from 'commander'
import fs from 'fs'
import path from 'path'
import packageFile from '../package.json'

function main () {
  const default_host = process.env.DDN_HOST || '127.0.0.1'
  const default_port = process.env.DDN_PORT || 8001
  program.version(packageFile.version)
    .option('-H, --host <host>', `Specify the hostname or ip of the node, default: ${default_host}`, default_host)
    .option('-P, --port <port>', `Specify the port of the node, default: ${default_port}`, default_port)
    .option('-M, --main', 'Specify the mainnet, default: false')

  const plugins = fs.readdirSync(path.join(__dirname, 'plugins'))
  plugins.forEach(el => {
    if (el.endsWith('js')) {
      const plugin = require(`./plugins/${el}`).default || require(`./plugins/${el}`)
      plugin(program)
    }
  })

  if (!process.argv.slice(2).length) {
    program.outputHelp()
  }

  program.parse(process.argv)
}

main()
