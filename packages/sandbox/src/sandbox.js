/**
 * DDN沙盒
 * wangxm   2019-06-19
 */
import { spawn } from 'child_process'

import path from 'path'

class Sandbox {
  constructor (context, appId, callback) {
    this._context = context

    this._appId = appId
    this._appPath = path.join(this._context.config.dappsDir, appId)

    this._callback = callback

    this._sandboxVM = path.join(__dirname, 'safe-shell.js')

    this._cb = {}

    this._process = null
  }

  _invokCallback (type, data) {
    if (typeof (this._callback) === 'function') {
      this._callback(type, data)
    }
  }

  run (args) {
    if (this._process === null) {
      let params = [this._sandboxVM, this._appPath]
      params = params.concat(args)

      this._process = spawn('node', params, {
        cwd: this._appPath,
        stdio: ['pipe', 'pipe', 'pipe', 'ipc']
        // detached: false,
        // shell: os.platform() === "win32" ? "cmd.exe" : "/bin/sh"
      })

      this._process.on('error', (err) => {
        this._context.logger.error(`Dapp[${this._appId}] fail: ${err.message}`)
        this._invokCallback('error', err)
      })

      this._process.on('message', (msg) => {
        this._handleMessage(msg)
        this._invokCallback('message', msg)
      })

      this._process.on('close', (code) => {
        const info = `Dapp[${this._appId}] exit` + (code ? `: ${code}` : '.')
        this._context.logger.info(info)
        this._invokCallback('close', code)
      })

      this._process.stdout.on('data', (data) => {
        this._context.logger.info(`Dapp stdout[${this._appId}]: ${data}`)
        this._invokCallback('stdout_data', data)
      })

      this._process.stderr.on('data', (data) => {
        this._context.logger.error(`Dapp stderr[${this._appId}]: ${data}`)
        this._invokCallback('stderr_data', data)
      })
    }

    return this._process
  }

  stop () {
    if (this._process !== null && !this._process.killed) {
      try {
        this._process.disconnect()
      } catch (err) {
        ;
      }

      this._process.kill()
      this._process = null
    }
  }

  /**
     * 向沙盒程序发起请求
     * @param {*} req
     * @param {*} cb
     */
  request (req, cb) {
    if (req &&
            typeof (req.method) === 'string' &&
            typeof (req.path) === 'string' &&
            typeof (cb) === 'function') {
      req.seq = Math.round(Math.random() * 1000000)
      this._cb[`${req.method}_${req.path}_${req.seq}`] = cb

      if (this._process &&
                typeof (this._process.send) === 'function') {
        this._process.send(req)
      }
    }
  }

  /**
     * 处理沙盒程序返回的消息
     * @param {*} msg
     */
  _handleMessage (msg) {
    if (msg &&
            typeof (msg.method) === 'string' &&
            typeof (msg.path) === 'string' &&
            typeof (msg.seq) === 'number' &&
            (msg.result || msg.error)) {
      const key = `${msg.method}_${msg.path}_${msg.seq}`
      if (typeof (this._cb[key]) === 'function') {
        this._cb[key](msg.error, msg.result)
      }
    }
  }
}

export default Sandbox
