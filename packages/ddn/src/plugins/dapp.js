import inquirer from 'inquirer'
import fs from 'fs'
import request from 'request'

import accountHelper from '../helpers/account.js'
import dappHelper from '../helpers/dapp.js'
import { prompt } from '../utils/prompt'

import { generateDapp } from './dapp/generate'

let globalOptions

function getApi () {
  return new Api({ host: globalOptions.host, port: globalOptions.port, mainnet: !!globalOptions.main })
}

function bip39Validator (input) {
  const done = this.async()

  if (!accountHelper.isValidSecret(input)) {
    done('Secret is not validated by BIP39')
    return
  }

  done(null, true)
}

function assetNameValidator (input) {
  const done = this.async()
  if (!input || !/^[A-Z]{3,6}$/.test(input)) {
    return done('Invalid currency symbol')
  }
  done(null, true)
}

function amountValidator (input) {
  const done = this.async()
  if (!/^[1-9][0-9]*$/.test(input)) {
    return done('Amount should be integer')
  }
  done(null, true)
}

function precisionValidator (input) {
  const done = this.async()
  const precision = Number(input)
  if (!Number.isInteger(precision) || precision < 0 || precision > 16) {
    return done('Precision is between 0 and 16')
  }
  done(null, true)
}

function depositDapp () {
  inquirer.prompt([
    {
      type: 'password',
      name: 'secret',
      message: 'Enter secret',
      validate: function (value) {
        return value.length > 0 && value.length < 100
      },
      required: true
    },
    {
      type: 'input',
      name: 'amount',
      message: 'Enter amount',
      validate: function (value) {
        return !isNaN(parseInt(value))
      },
      required: true
    },
    {
      type: 'input',
      name: 'dappId',
      message: 'DApp Id',
      required: true
    },
    {
      type: 'input',
      name: 'secondSecret',
      message: 'Enter secondary secret (if defined)',
      validate: function (value) {
        return value.length < 100
      },
      required: false
    }
  ], function (result) {
    var realAmount = parseFloat((parseInt(result.amount) * 100000000).toFixed(0))
    var body = {
      secret: result.secret,
      dappId: result.dappId,
      amount: realAmount
    }

    if (result.secondSecret && result.secondSecret.length > 0) {
      body.secondSecret = result.secondSecret
    }

    inquirer.prompt([
      {
        type: 'input',
        name: 'host',
        message: 'Host and port',
        default: 'localhost:8001',
        required: true
      }
    ], function (result) {
      request({
        url: 'http://' + result.host + '/api/dapps/transaction',
        method: 'put',
        json: true,
        body: body
      }, function (err, resp, body) {
        console.log(err, body)
        if (err) {
          return console.log(err.toString())
        }

        if (body.success) {
          console.log(body.transactionId)
        } else {
          return console.log(body.error)
        }
      })
    })
  })
}

function withdrawalDapp () {
  inquirer.prompt([
    {
      type: 'password',
      name: 'secret',
      message: 'Enter secret',
      validate: function (value) {
        return value.length > 0 && value.length < 100
      },
      required: true
    },
    {
      type: 'input',
      name: 'amount',
      message: 'Amount',
      validate: function (value) {
        return !isNaN(parseInt(value))
      },
      required: true
    },
    {
      type: 'input',
      name: 'dappId',
      message: 'Enter DApp id',
      validate: function (value) {
        var isAddress = /^[0-9]+$/g
        return isAddress.test(value)
      },
      required: true
    }], function (result) {
    var body = {
      secret: result.secret,
      amount: Number(result.amount)
    }

    request({
      url: 'http://localhost:8001/api/dapps/' + result.dappId + '/api/withdrawal',
      method: 'post',
      json: true,
      body: body
    }, function (err, resp, body) {
      if (err) {
        return console.log(err.toString())
      }

      if (body.success) {
        console.log(body.transactionId)
      } else {
        return console.log(body.error)
      }
    })
  })
}

function uninstallDapp () {
  inquirer.prompt([
    {
      type: 'input',
      name: 'dappId',
      message: 'Enter dapp id',
      validate: function (value) {
        return value.length > 0 && value.length < 100
      },
      required: true
    },
    {
      type: 'input',
      name: 'host',
      message: 'Host and port',
      default: 'localhost:8001',
      required: true
    },
    {
      type: 'password',
      name: 'masterpassword',
      message: 'Enter dapp master password',
      required: true
    }], function (result) {
    var body = {
      id: String(result.dappId),
      master: String(result.masterpassword)
    }

    request({
      url: 'http://' + result.host + '/api/dapps/uninstall',
      method: 'post',
      json: true,
      body: body
    }, function (err, resp, body) {
      if (err) {
        return console.log(err.toString())
      }

      if (body.success) {
        console.log('Done!')
      } else {
        return console.log(body.error)
      }
    })
  })
}

function installDapp () {
  inquirer.prompt([
    {
      type: 'input',
      name: 'dappId',
      message: 'Enter dapp id',
      validate: function (value) {
        return value.length > 0 && value.length < 100
      },
      required: true
    },
    {
      type: 'input',
      name: 'host',
      message: 'Host and port',
      default: 'localhost:8001',
      required: true
    },
    {
      type: 'password',
      name: 'masterpassword',
      message: 'Enter dapp master password',
      required: true
    }], function (result) {
    var body = {
      id: String(result.dappId),
      master: String(result.masterpassword)
    }

    request({
      url: 'http://' + result.host + '/api/dapps/install',
      method: 'post',
      json: true,
      body: body
    }, function (err, resp, body) {
      if (err) {
        return console.log(err.toString())
      }

      if (body.success) {
        console.log('Done!', body.path)
      } else {
        return console.log(body.error)
      }
    })
  })
}

async function createGenesisBlock () {
  var genesisSecret = await prompt({
    type: 'password',
    name: 'genesisSecret',
    message: 'Enter master secret of your genesis account',
    validate: bip39Validator
  })

  var wantInbuiltAsset = await inquirer.prompt({
    type: 'confirm',
    name: 'wantInbuiltAsset',
    message: 'Do you want publish a inbuilt asset in this dapp?',
    default: false
  })

  var assetInfo = null
  if (wantInbuiltAsset) {
    var name = await prompt({
      type: 'input',
      name: 'assetName',
      message: 'Enter asset name, for example: BTC, CNY, USD, MYASSET',
      validate: assetNameValidator
    })
    var amount = await prompt({
      type: 'input',
      name: 'assetAmount',
      message: 'Enter asset total amount',
      validate: amountValidator
    })
    var precision = await prompt({
      type: 'input',
      name: 'assetPrecison',
      message: 'Enter asset precision',
      validate: precisionValidator
    })
    assetInfo = {
      name: name,
      amount: amount,
      precision: precision
    }
  }

  var account = accountHelper.account(genesisSecret)
  var dappBlock = dappHelper.new(account, null, assetInfo)
  var dappGenesisBlockJson = JSON.stringify(dappBlock, null, 2)
  fs.writeFileSync('genesis.json', dappGenesisBlockJson, 'utf8')
  console.log('New genesis block is created at: ./genesis.json')
}

async function registerDapp (options) {
  if (!options.metafile || !fs.existsSync(options.metafile)) {
    console.error('Error: invalid params, dapp meta file must exists')
    return
  }
  var dapp = JSON.parse(fs.readFileSync(options.metafile, 'utf8'))
  var trs = await NodeSdk.dapp.createDApp(dapp, options.secret, options.secondSecret)
  getApi().broadcastTransaction(trs, function (err, result) {
    console.log(err || result.transactionId)
  })
}

module.exports = function (program) {
  globalOptions = program

  program
    .command('dapp')
    .description('manage your dapps')
    .option('-n, --new', 'genereate new dapp')
    .option('-d, --deposit', 'deposit funds to dapp')
    .option('-w, --withdrawal', 'withdraw funds from dapp')
    .option('-i, --install', 'install dapp')
    .option('-u, --uninstall', 'uninstall dapp')
    .option('-g, --genesis', 'create genesis block')
    .action(function (options) {
      (async function () {
        try {
          if (options.new) {
            generateDapp()
          } else if (options.deposit) {
            depositDapp()
          } else if (options.withdrawal) {
            withdrawalDapp()
          } else if (options.install) {
            installDapp()
          } else if (options.uninstall) {
            uninstallDapp()
          } else if (options.genesis) {
            createGenesisBlock()
          } else {
            console.log("'DDN dapp -h' to get help")
          }
        } catch (e) {
          console.error(e)
        }
      })()
    })

  program
    .command('registerDapp')
    .description('register a dapp')
    .option('-e, --secret <secret>', '')
    .option('-s, --secondSecret <secret>', '')
    .option('-f, --metafile <metafile>', 'dapp meta file')
    .action(registerDapp)
}
