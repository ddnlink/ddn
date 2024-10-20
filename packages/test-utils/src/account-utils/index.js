import accountsDefault from './accounts.ddn'

let accounts = accountsDefault

if (process.env.DDN_ENV === 'custom') {
  accounts = require('./accounts.custom').default
}

if (process.env.DDN_ENV === 'testnet') {
  accounts = require('./accounts.ddn.testnet').default
}

export { accounts }
