import accounts from './accounts.ddn'

let result = accounts

if (process.env.DDN_ENV === 'custom') {
  result = require('./accounts.custom').default
}

export default result
