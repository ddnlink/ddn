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
  return tracer[fun](conf)
}

export { logger }
