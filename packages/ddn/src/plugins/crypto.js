import inquirer from 'inquirer'
import cryptoLib from '@ddn/crypto'
import accountHelper from '../helpers/account.js'

async function genPubkey () {
  const result = await inquirer.prompt([
    {
      type: 'password',
      name: 'secret',
      message: 'Enter secret of your testnet account'
    }
  ])
  const account = accountHelper.account(result.secret.trim())
  console.log('Public key: ' + account.keypair.publicKey)
  console.log('Address: ' + account.address)
}

async function genAccount () {
  const result = await inquirer.prompt([
    {
      type: 'input',
      name: 'amount',
      message: 'Enter number of accounts to generate'
    }
  ])
  const n = parseInt(result.amount)
  const accounts = []

  for (let i = 0; i < n; i++) {
    const a = accountHelper.account(cryptoLib.generateSecret())
    accounts.push({
      address: a.address,
      secret: a.secret,
      publicKey: a.keypair.publicKey
    })
  }
  console.log(accounts)
  console.log('Done')
}

export default function (program) {
  program
    .command('crypto')
    .description('crypto operations')
    .option('-p, --pubkey', 'generate public key from secret')
    .option('-g, --generate', 'generate random accounts')
    .action(function (options) {
      (async function () {
        try {
          if (options.pubkey) {
            genPubkey()
          } else if (options.generate) {
            genAccount()
          } else {
            console.log("'ddn crypto -h' to get help")
          }
        } catch (e) {
          console.log(e)
        }
      })()
    })
}
