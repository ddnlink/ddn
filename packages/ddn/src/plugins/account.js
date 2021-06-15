import inquirer from 'inquirer'
import * as crypto from '@ddn/crypto'
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
    const a = accountHelper.account(crypto.generateSecret())
    accounts.push({
      address: a.address,
      secret: a.secret,
      publicKey: a.keypair.publicKey
    })
  }
  console.log(accounts)
  console.log('Done')
}

export { genPubkey, genAccount }
