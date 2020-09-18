import fs from 'fs'
import nodeSdk from '@ddn/node-sdk'
import cryptoLib from '@ddn/crypto'

import accountHelper from '../helpers/account.js'

function writeFileSync (file, obj) {
  const content = (typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2))
  fs.writeFileSync(file, content, 'utf8')
}

function appendFileSync (file, obj) {
  const content = (typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2))
  fs.appendFileSync(file, content, 'utf8')
}

// 用于分割原始100亿
function genUsers ({ tokenPrefix, tokenName }) {
  // console.log(nodeSdk.constants)
  const _tokenPrefix = tokenPrefix || nodeSdk.constants.tokenPrefix

  const wan = 10000
  const users = []
  // 1亿的75个，75亿
  for (let i = 1; i < 76; i++) {
    const user = accountHelper.account(cryptoLib.generateSecret(), _tokenPrefix)
    user.username = `user_${i}`
    user.amount = 10000 * wan
    users.push(user)
  }

  // 2000万的75个, 15亿
  for (let i = 76; i < 151; i++) {
    const user = accountHelper.account(cryptoLib.generateSecret(), _tokenPrefix)
    user.username = `user_${i}`
    user.amount = 2000 * wan
    users.push(user)
  }

  // 1000万的100个，10亿
  for (let i = 151; i < 251; i++) {
    const user = accountHelper.account(cryptoLib.generateSecret(), _tokenPrefix)
    user.username = `user_${i}`
    user.amount = 1000 * wan
    users.push(user)
  }

  // 基金账号
  const user = accountHelper.account(cryptoLib.generateSecret(), _tokenPrefix)

  user.username = `${tokenName} Foundation`
  user.amount = 0
  users.push(user)

  let liststr = ''
  const teamusers = users.map(i => {
    delete i.keypair
    liststr += `${i.address}, ${i.amount}` + '\n'
    return i
  })

  const logFile = './teams.log'
  writeFileSync(logFile, 'Accounts:\n')
  appendFileSync(logFile, teamusers)
  writeFileSync('./teams.txt', liststr.replace(/(\s*$)/g, ' '))
  console.log('New team and related users have been created, please see the two files: ./teams.log and ./teams.txt')
}

export default program => {
  program
    .command('createUsers')
    .description('create some accounts')
    .option('-p, --tokenPrefix <prefix>', 'default is `D`')
    .option('-t, --tokenName <name>', 'default is `DDN`')
    .action(genUsers)
}
