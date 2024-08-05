import chalk from 'chalk'
import signale from 'signale'
import marked from 'marked'
import TerminalRenderer from 'marked-terminal'
import { existsSync, writeFileSync } from 'fs'
// 支持内部框架扩展 error code map
import ERROR_CODE_MAP from '@umijs/error-code-map'
import osLocale from 'os-locale'

marked.setOptions({
  renderer: new TerminalRenderer()
})

export class DdnError extends Error {
  constructor (opts, ...params) {
    const { message, code, context } = opts
    super(message, ...params)
    this.code = code
    this.context = context || {}

    this.test()
  }

  test () {
    if (this.code) {
      return
    }
    for (const c of Object.keys(ERROR_CODE_MAP)) {
      const { test } = ERROR_CODE_MAP[c]
      if (test && test({ error: this, context: this.context })) {
        this.code = c
        break
      }
    }
  }
}

export function printDdnError (e, opts = {}) {
  if (!(e instanceof DdnError)) {
    signale.error(e)
    return
  }

  const { detailsOnly } = opts
  const { code } = e

  if (!code) return

  const { message, details } = ERROR_CODE_MAP[code]
  console.error(`\n${chalk.bgRed.black(' ERROR CODE ')} ${chalk.red(code)}`)

  if (!detailsOnly) {
    console.error(`\n${chalk.bgRed.black(' ERROR ')} ${chalk.red(e.message || message)}`)
  }

  const lang = osLocale.sync()

  if (lang === 'zh-CN') {
    console.error(`\n${chalk.bgMagenta.black(' DETAILS ')}\n\n${marked(details['zh-CN'])}`)
  } else {
    console.error(`\n${chalk.bgMagenta.black(' DETAILS ')}\n\n${marked(details.en)}`)
  }

  if (!detailsOnly && e.stack) {
    console.error(`${chalk.bgRed.black(' STACK ')}\n\n${e.stack.split('\n').slice(1).join('\n')}`)
  }

  // 将错误信息输出到文件
  if (process.env.DUMP_ERROR_PATH) {
    try {
      if (existsSync(process.env.DUMP_ERROR_PATH)) {
        return
      }
      writeFileSync(
        process.env.DUMP_ERROR_PATH,
        JSON.stringify({
          code,
          message,
          stack: e.stack
        })
      )
    } catch (_) {
      //
    }
  }
}
