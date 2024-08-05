import fs from 'fs'
import * as cryptoLib from '@ddn/crypto'

import accountHelper from '../helpers/account.js'

function writeFileSync (file, obj) {
  const content = typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2)
  fs.writeFileSync(file, content, 'utf8')
}

function appendFileSync (file, obj) {
  const content = typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2)
  fs.appendFileSync(file, content, 'utf8')
}

function genUsers ({ tokenPrefix, tokenName, totalAmount, count, one }) {
  const users = []

  // 1个默认基金账号
  const user = accountHelper.account(cryptoLib.generateSecret(), tokenPrefix)

  user.username = `${tokenName} Foundation`
  user.amount = 0
  users.push(user)

  // 1个特殊账号
  const oneUser = accountHelper.account(cryptoLib.generateSecret(), tokenPrefix)

  oneUser.username = `${tokenName} one`
  oneUser.amount = one
  users.push(oneUser)

  // 其他账号 total 被分成 count 个账号
  const total = totalAmount - one
  const everyAmount = Math.ceil(total / (count - 1))
  const onlyOne = total % everyAmount

  // 常规账号
  for (let i = 1; i < count; i++) {
    const user = accountHelper.account(cryptoLib.generateSecret(), tokenPrefix)
    user.username = `${tokenName}_${i}`
    user.amount = i === count - 1 && onlyOne !== 0 ? onlyOne : everyAmount
    users.push(user)
  }

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

export { genUsers }
