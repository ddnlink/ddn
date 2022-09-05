import fs from 'fs'
import inquirer from 'inquirer'

const cryptoCategories = ['@ddn/crypto-nacl', '@ddn/crypto-sm']
export async function setCrypto (options) {
  const result = await inquirer.prompt([
    {
      type: 'rawlist',
      name: 'crypto',
      message: 'Choose crypto',
      choices: cryptoCategories,
      required: true
    }
  ])
  const filename = './constants'
  writeFileSync(filename + '.js', result)
}

function writeFileSync (file, obj) {
  const content = typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2)
  fs.writeFileSync(file, `module.exports=${content}`, 'utf8')
}
