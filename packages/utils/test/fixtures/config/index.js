import ddn from './ddnrc'

let config = ddn

if (process.env.DDN_ENV === 'custom') {
  config = require('./ddnrc.custom').default
}

export default config