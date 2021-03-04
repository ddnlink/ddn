import fs from 'fs'
import path from 'path'
import tracer from 'tracer'

function getConf (options) {
  return {
    root: path.join(options.baseDir, 'logs'),
    maxLogFiles: 10,
    allLogsFileName: 'debug',
    level: options.configObject.logLevel,
    format: [
      '{{title}} {{timestamp}} {{file}}:{{line}} ({{method}}) {{message}}', // default format
      {
        error: '{{title}} {{timestamp}} {{file}}:{{line}} ({{method}}) {{message}} \nCall Stack:\n{{stack}}' // error format
      }
    ],
    dateformat: 'HH:MM:ss.L'
  }
}

function logger (config) {
  const conf = getConf(config)
  const fun = process.env.NODE_ENV === 'production' ? 'dailyfile' : 'colorConsole'
  if (process.env.NODE_ENV !== 'production') {
    conf.transport = function (data) {
      console.log(data.output)
      fs.appendFile(path.join(config.baseDir, 'logs', 'debug.log'), data.rawoutput + '\n', err => {
        if (err) throw err
      })
    }
  }
  return tracer[fun](conf)
}

export { logger }
