import inquirer from 'inquirer'
import fs from 'fs'
import path from 'path'

const contractsPath = path.join('.', 'modules', 'contracts')

function addContract () {
  try {
    var filenames = fs.readdirSync(contractsPath)
    inquirer.prompt(
      [
        {
          type: 'input',
          name: 'filename',
          message: 'Contract file name (without .js)'
        }
      ],
      function (result) {
        var name = result.filename
        var type = filenames.length
        var filename = result.filename + '.js'

        var className = ''
        for (var i = 0; i < name.length; ++i) {
          className += i === 0 ? name[i].toUpperCase() : name[i]
        }
        var exampleContract = fs.readFileSync(
          path.join(__dirname, '..', 'contract-example.js'),
          'utf8'
        )
        exampleContract = exampleContract.replace(
          /ExampleContract/g,
          className
        )
        exampleContract = exampleContract.replace(
          /__TYPE__/g,
          'TransactionTypes.' + name.toUpperCase()
        )
        fs.writeFileSync(
          path.join(contractsPath, filename),
          exampleContract,
          'utf8'
        )

        // FIXME: 2020.4.22 ./modules/helpers 文件夹已经转移
        var typesFile = path.resolve(
          './modules/helpers/transaction-types.js'
        )
        var transactionTypes = require(typesFile)
        transactionTypes[name.toUpperCase()] = type
        fs.writeFileSync(
          typesFile,
          'module.exports = ' +
                        JSON.stringify(transactionTypes, null, 2),
          'utf8'
        )

        console.log(
          'New contract created: ' + ('./contracts/' + filename)
        )
        console.log('Updating contracts list')

        var text = fs.readFileSync(
          path.join('.', 'modules.full.json'),
          'utf8'
        )
        var modules = JSON.parse(text)
        var contractName = 'contracts/' + name
        var dappPathConfig = './' + path.join(contractsPath, filename)

        modules[contractName] = dappPathConfig
        modules = JSON.stringify(modules, false, 2)

        fs.writeFileSync(
          path.join('.', 'modules.full.json'),
          modules,
          'utf8'
        )
        console.log('Done')
      }
    )
  } catch (e) {
    console.log(e)
  }
}

function deleteContract () {
  inquirer.prompt(
    [
      {
        type: 'input',
        name: 'filename',
        message: 'Contract file name (without .js)'
      }
    ],
    function (result) {
      var name = result.filename
      var filename = result.filename + '.js'

      var contractPath = path.join(contractsPath, filename)
      var exists = fs.existsSync(contractPath)
      if (!exists) {
        return console.log('Contract not found: ' + contractPath)
      }
      try {
        fs.unlinkSync(contractPath)
        console.log('Contract removed')
        console.log('Updating contracts list')

        var text = fs.readFileSync(
          path.join('.', 'modules.full.json'),
          'utf8'
        )
        var modules = JSON.parse(text)
        var name = 'contracts/' + name
        delete modules[name]
        modules = JSON.stringify(modules, false, 2)
        fs.writeFileSync(
          path.join('.', 'modules.full.json'),
          modules,
          'utf8'
        )
        console.log('Done')
      } catch (e) {
        console.log(e)
      }
    }
  )
}

export default function (program) {
  program
    .command('contract')
    .description('contract operations')
    .option('-a, --add', 'add new contract')
    .option('-d, --delete', 'delete contract')
    .action(function (options) {
      var exist = fs.existsSync(contractsPath)
      if (exist) {
        if (options.add) {
          addContract()
        } else if (options.delete) {
          deleteContract()
        } else {
          console.log("'node contract -h' to get help")
        }
      } else {
        return console.log(
          './modules/contracts path not found, please change directory to your dapp folder'
        )
      }
    })
}
