import _ from 'lodash'
// import DdnUtils from '@ddn/utils';

/**
 * 产生随机字符串
 * @param  {...any} args 常用参数为 randomName('D', 'abc...', 5)
 */
function randomName (...args) {
  // Convert arguments to Array
  const array = Array.prototype.slice.apply(args)

  let size = 16
  if (array.length > 2) {
    size = array.pop()
  }

  let name = array[0]
  const random = array[1]

  for (let i = 0; i < size; i++) {
    name += random.charAt(Math.floor(Math.random() * random.length))
  }

  return name
}

// Used to create random delegates names
function randomDelegateName () {
  return randomName('', 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', 20)
}

// Randomize a property from within an object
function randomProperty (obj, needKey) {
  const keys = Object.keys(obj)

  if (!needKey) {
    return obj[keys[keys.length * Math.random() << 0]]
  } else {
    return keys[keys.length * Math.random() << 0]
  }
}

// Randomizes DDN amount
function randomCoin () {
  // const { bignum } = DdnUtils;
  return `${Math.floor(Math.random() * (10000 * 100000000)) + (1000 * 100000000)}`
  // return bignum.plus(bignum.floor(bignum.multiply(Math.random(), 100000, 100000000)), 1).toString();
}

// Dao
function randomOrgId () {
  const name = randomName('', 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', 10)
  return `DAO1${name}M` // >= 5 bit
}

function randomIpId () {
  const name = randomName('', 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', 15)
  const date = new Date()
  const time = `${date.getFullYear()}${date.getUTCMonth()}${date.getUTCDate()}`
  return `IPID${time}${name}A` // >= 5 bit
}

// Used to randomize selecting from within an array. Requires array length
function randomizeSelection (length) {
  return Math.floor(Math.random() * length)
}

// Returns a random number between min (inclusive) and max (exclusive)
function randomNumber (min, max) {
  return Math.floor(Math.random() * (max - min) + min)
}

// Used to create random usernames
function randomUsername (max) {
  if (!max) {
    max = 16
  }
  return randomName('', 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@$&_.', max)
}

function randomIssuerName (prefix, max) {
  if (!prefix) {
    prefix = '' // 不能超过 12?
  }

  if (!max) {
    max = 10 // 不能超过 12?
  }

  return randomName(prefix, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', max)
}

// Used to create random basic accounts
function randomAccount () {
  const account = {
    address: '',
    publicKey: '',
    password: '',
    secondPassword: '',
    username: '',
    balance: 0
  }

  account.password = randomPassword()
  account.secondPassword = randomPassword()
  account.username = randomDelegateName()

  return account
}

// Used to create random transaction accounts (holds additional info to regular account)
function randomTxAccount () {
  return _.defaults(randomAccount(), {
    sentAmount: '',
    paidFee: '',
    totalPaidFee: '',
    transactions: []
  })
}

// Used to create random passwords
function randomPassword () {
  return Math.random().toString(36).substring(7)
}

export {
  randomName,
  randomProperty,
  randomDelegateName,
  randomCoin,
  randomPassword,
  randomAccount,
  randomTxAccount,
  randomUsername,
  randomIssuerName,
  randomNumber,
  randomizeSelection,
  randomOrgId,
  randomIpId
}
