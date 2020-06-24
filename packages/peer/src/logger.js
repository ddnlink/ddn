/* ---------------------------------------------------------------------------------------------
 *  Created by DDN Team on Wed Mar 14 2017 16:23:6
 *
 *  Copyright (c) 2019 DDN Foundation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

import stftime from 'strftime'
import fs from 'fs'

require('colors')

const strftime = stftime.utc()

Object.defineProperty(global, '__stack', {
  get (...args) {
    const orig = Error.prepareStackTrace
    Error.prepareStackTrace = (_, stack) => {
      return stack
    }
    const err = new Error()
    Error.captureStackTrace(err, args.callee)
    const stack = err.stack
    Error.prepareStackTrace = orig
    return stack
  }
})

const stack_level = 2

Object.defineProperty(global, '__line', {
  get () {
    return __stack[stack_level].getLineNumber()
  }
})

Object.defineProperty(global, '__function', {
  get () {
    return __stack[stack_level].getFunctionName()
  }
})

Object.defineProperty(global, '__file', {
  get () {
    return __stack[stack_level].getFileName().split('/').slice(-1)[0]
  }
})

export const Logger = (config = {}) => {
  const exports = {}

  config.levels = config.levels || {
    trace: 0,
    debug: 1,
    log: 2,
    info: 3,
    warn: 4,
    error: 5,
    fatal: 6
  }

  config.filename = config.filename || './debug.log'

  config.errorLevel = config.errorLevel || 'log'

  const log_file = fs.createWriteStream(config.filename, { flags: 'a' })

  exports.setLevel = errorLevel => {
    config.errorLevel = errorLevel
  }

  Object.keys(config.levels).forEach(name => {
    function log (caption, data) {
      const log = {
        level: name,
        message: caption,
        timestamp: strftime('%F %T %L', new Date())
      }

      data && (log.data = data)

      if (config.levels[config.errorLevel] <= config.levels[log.level]) {
        log_file.write(`${JSON.stringify(log)}\n`)
      }
      if (config.echo && config.levels[config.echo] <= config.levels[log.level]) {
        try {
          console.log(log.level.bgYellow.black, log.timestamp.grey, log.message, log.data ? log.data : '')

          // FIXME: The __file + ':' + __line can not be uesed? 2019.12.21
          // console.log(log.level.bgYellow.black, log.timestamp.grey, __file + ':' + __line, log.message, log.data ? log.data : '');
        } catch (e) {
          console.log(e)
        }
      }
    }

    exports[name] = log
  })

  return exports
}