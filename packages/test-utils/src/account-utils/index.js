import accounts from './accounts.ddn'

if (process.env.DDN_ENV === 'custom') {
  accounts = require('./accounts.custom').default
}

export { accounts }
