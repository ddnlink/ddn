/**
 * Http服务
 *
 * 服务采用目录结构形式，如api目录自动路由为 /api，具体路由方法定义在目录下方的 index.js 文件中
 *
 * index.js文件需要输出一个类，类方法为路由子路径，根据请求方式分为post、get、delete、put 4种
 * 如请求块高方法，可以定义为 getHeight，然后具体路由会解析为 /height，然后和所在目录路由拼接为完整路由，/api/height
 * 方法输入参数为request对象，输出为json对象
 *
 * 如果想定义目录路由的根方法，可以在index.js中直接定义 post方法、get方法等，则完整路由就是 get /api  post /api
 *
 * wangxm   2018-12-25
 */
import express from 'express'

import os from 'os'
import path from 'path'
import fs from 'fs'
import http from 'http'
import https from 'https'
import socketio from 'socket.io'
import compression from 'compression'
import cors from 'cors'
import bodyParser from 'body-parser'
import methodOverride from 'method-override'
import DdnUtils from '@ddn/utils'
import queryParser from './middleware/query-int'
import SocketioEmiter from './socketio/'
import errorHandler from './middleware/errorHandler'

class HttpServer {
  static newServer (context) {
    errorHandler()
    return new HttpServer(context)
  }

  constructor (context) {
    Object.assign(this, context)
    this._context = context

    this._app = express()
    this._app.use(compression({
      level: 6
    }))
    this._app.use(cors())
    this._app.options('*', cors())

    this._http_server = http.createServer(this._app)
    this._http_io = socketio(this._server)

    if (this.config.ssl.enabled) {
      const privateKey = fs.readFileSync(this.config.ssl.options.key)
      const certificate = fs.readFileSync(this.config.ssl.options.cert)

      this._https_server = https.createServer({
        key: privateKey,
        cert: certificate,
        ciphers: 'ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:' +
                    'ECDHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384:DHE-RSA-AES256-SHA384:ECDHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA256:HIGH:' +
                    '!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA'
      }, this._app) // FIXME: app -> this._app ?

      this._https_io = require('socket.io')(this._https_server)
    }

    context.runtime.socketio = new SocketioEmiter(context, this._http_io, this._https_io)

    this._apiRouters = {}

    this._init()
  }

  _init () {
    this._app.engine('html', require('ejs').renderFile)
    this._app.use(require('express-domain-middleware'))
    this._app.set('view engine', 'ejs')
    this._app.set('views', this.config.publicDir)
    this._app.use(express.static(this.config.publicDir))
    this._app.use(bodyParser.raw({
      limit: this.config.payloadLimitSize
    }))
    this._app.use(bodyParser.urlencoded({
      extended: true,
      limit: this.config.payloadLimitSize,
      parameterLimit: 5000
    }))
    this._app.use(bodyParser.json({
      limit: this.config.payloadLimitSize
    }))
    this._app.use(methodOverride())

    this._addQueryParamsMiddleware()
    this._addSecurityMiddleware()
    this._addErrorHandleMiddleware()

    this._addCommonHeadersMiddleware()
  }

  /**
     * 404 错误处理
     * 拦截全部使用 next(err) 的错误信息。
     */
  _add404ErrorHandleMiddleware () {
    this._app.all('*', (req, res) => {
      res.json({
        success: false,
        error: '404 error',
        message: 'Can`t get ' + req.params[0]
      })
    })
  }

  /**
     * 错误处理
     * 拦截全部使用 next(err) 的错误信息。
     */
  _addErrorHandleMiddleware () {
    this._app.use((err, req, res, next) => {
      res.status(200)
      res.json({
        success: false,
        error: err.message,
        raw: err
      })
    })
  }

  /**
     * 转换输入参数类型（字符串 -> 整型）
     */
  _addQueryParamsMiddleware () {
    const ignore = [
      'id', 'name', 'lastBlockId', 'blockId', 'transactionId',
      'address', 'recipientId', 'senderId', 'previousBlock', 'ip',
      'fee', 'totalFee', 'amount', 'totalAmount', 'height', 'reward'
    ]
    this._app.use(queryParser({
      parser (value, radix, name) {
        if (ignore.includes(name)) {
          return value
        }

        if (isNaN(value) || parseInt(value) !== value || isNaN(parseInt(value, radix))) {
          return value
        }

        return parseInt(value)
      }
    }))
  }

  /**
     * 公共头信息
     */
  _addCommonHeadersMiddleware () {
    const commonHeaders = {
      os: os.platform() + os.release(),
      version: this.config.version,
      port: this.config.port,
      nethash: this.config.nethash
    }

    this._app.use(({
      url
    }, res, next) => {
      const parts = url.split('/')
      if (parts.length > 1) {
        if (parts[1] === 'peer') {
          res.set(commonHeaders)
        }
      }

      next()
    })
  }

  /**
     * 安全约束中间件（api白名单、peer黑名单）
     */
  _addSecurityMiddleware () {
    this._app.use(({
      url,
      headers,
      connection,
      method
    }, res, next) => {
      const parts = url.split('/')
      const ip = headers['x-forwarded-for'] || connection.remoteAddress
      let port = headers.port
      if (!port) {
        const host = headers.host
        if (host) {
          const hostItems = host.split(':')
          if (hostItems && hostItems.length === 2) {
            port = hostItems[1]
          }
        }
      }
      if (!port) {
        port = this.config.port
      }

      this.logger.debug(`${method} ${url} from ${ip}:${port}`)

      /* Instruct browser to deny display of <frame>, <iframe> regardless of origin.
             *
             * RFC -> https://tools.ietf.org/html/rfc7034
             */
      res.setHeader('X-Frame-Options', 'DENY')

      /* Set Content-Security-Policy headers.
             *
             * frame-ancestors - Defines valid sources for <frame>, <iframe>, <object>, <embed> or <applet>.
             *
             * W3C Candidate Recommendation -> https://www.w3.org/TR/CSP/
             */
      res.setHeader('Content-Security-Policy', "frame-ancestors 'none'")

      if (parts.length > 1) {
        if (parts[1] === 'api') {
          if (this.config.api.access.whiteList.length > 0 &&
                        !this.config.api.access.whiteList.includes(ip)) {
            res.sendStatus(403)
          } else {
            next()
          }
        } else if (parts[1] === 'peer') {
          if (this.config.peers.blackList.length > 0 &&
                        this.config.peers.blackList.includes(ip)) {
            res.sendStatus(403)
          } else {
            next()
          }
        } else {
          next()
        }
      } else {
        next()
      }
    })
  }

  /**
     * 遍历指定目录的子目录和文件
     * @param {*} currDir
     */
  async _enumerateDir (currDir) {
    const items = fs.readdirSync(currDir)
    for (let i = 0; i < items.length; i++) {
      const item = items[i]

      const subPath = path.resolve(currDir, item)
      const itemInfo = fs.statSync(subPath)
      if (itemInfo.isDirectory()) {
        await this._enumerateFiles(subPath)
        await this._enumerateDir(subPath)
      }
    }
  }

  /**
     * 遍历指定目录下的文件
     * @param {*} currDir
     */
  async _enumerateFiles (currDir) {
    const items = fs.readdirSync(currDir)
    for (let i = 0; i < items.length; i++) {
      const item = items[i]

      const subPath = path.resolve(currDir, item)
      const itemInfo = fs.statSync(subPath)
      if (itemInfo.isFile()) {
        const pos = item.lastIndexOf('.')
        if (pos >= 0) {
          const ext = item.substring(pos)
          if (ext.toLowerCase() === '.js') {
            const Kls = global._require_runtime_(subPath)
            const inst = new Kls(this._context)
            await this._mountRouter(subPath, Kls, inst)
          }
        }
      }
    }
  }

  /**
     * 将指定目录下的指定类挂载到指定路由
     * @param {*} currDir
     * @param {*} cls
     * @param {*} inst
     */
  async _mountRouter (currDir, {
    prototype
  }, inst) {
    const rootPath = await this._getBasePath()
    let basePath = currDir.toLowerCase().replace(rootPath.toLowerCase(), '')
    basePath = basePath.replace('.js', '') // .ts??
    basePath = basePath.replace(/\\/g, '/')
    if (!basePath.startsWith('/')) {
      basePath = `/${basePath}`
    }

    // 一旦注释这里，文件名也将作为路由的一部分
    const pos = basePath.lastIndexOf('/')
    if (pos >= 0) {
      basePath = basePath.substring(0, pos)
    }

    const newRouter = express.Router()

    if (typeof (inst.filter) === 'function') {
      await newRouter.use(async (req, res, next) => await inst.filter.call(this, req, res, next))
    }

    const names = Object.getOwnPropertyNames(prototype)
    for (let i = 0; i < names.length; i++) {
      const name = names[i]
      if (typeof (inst[name]) === 'function') {
        await this._tryAddRouter(newRouter, inst, name)
      }
    }

    await this._app.use(basePath, newRouter)
  }

  /**
     * 将指定类实例中的指定方法挂载到指定路由中
     * @param {*} router
     * @param {*} inst
     * @param {*} name
     */
  async _tryAddRouter (router, inst, name) {
    if (name) {
      let method = null

      const lowerName = name.toLowerCase()

      // TODO: 修改这里的方法，让其符合 rustful api 逻辑
      let subPath
      if (lowerName.startsWith('get')) {
        method = 'get'
        subPath = lowerName.substring(3)
      } else if (lowerName.startsWith('post')) {
        method = 'post'
        subPath = lowerName.substring(4)
      } else if (lowerName.startsWith('put')) {
        method = 'put'
        subPath = lowerName.substring(3)
      } else if (lowerName.startsWith('delete')) {
        method = 'delete'
        subPath = lowerName.substring(6)
      }

      if (method) {
        router[method].call(router, `/${subPath}`, async (req, res) => {
          try {
            const result = await inst[name].call(inst, req)
            res.json(result)
          } catch (err) {
            res.json({
              success: false,
              error: err.message || err.toString()
            })
          }
        })
      }
    }
  }

  async _getBasePath () {
    return path.resolve(__dirname, 'service') // todo：这里暂时写死，后期扩展下
  }

  /**
     * 启动http监听服务
     */
  async start () {
    const basePath = await this._getBasePath()
    await this._enumerateDir(basePath)

    this.runtime.transaction.mountAssetApis(this._app)

    // The last
    this._add404ErrorHandleMiddleware()

    if (process.env.NODE_ENV === 'development') {
      DdnUtils.routesMap(this._app, 'routes.log', this.logger)
    }

    const self = this

    return new Promise((resolve, reject) => {
      this._http_server.listen(this.config.port, this.config.address, err => {
        this.logger.info(`DDN http server listened on ${this.config.address}:${this.config.port}`)

        if (!err) {
          if (this.config.ssl.enabled) {
            this._https_server.listen(this.config.ssl.options.port,
              this.config.ssl.options.address, err2 => {
                if (err2) {
                  return reject(err2)
                }

                this._logger.info(`DDN https server listened on ${this.config.ssl.options.address}:${this.config.ssl.options.port}`)
                resolve(self)
              }
            )
          } else {
            resolve(self)
          }
        } else {
          reject(err)
        }
      })
    })
  }

  async addApiRouter (path) {
    const key = (`/api${path}`).toLowerCase()
    this._apiRouters[key] = this._app._router.stack.length

    const newRouter = express.Router()
    await this._app.use(`/api${path}`, newRouter)
    return newRouter
  }

  async removeApiRouter (path) {
    const key = (`/api${path}`).toLowerCase()
    if (this._apiRouters[key]) {
      const index = this._apiRouters[key]
      if (index >= 0 && index < this._app._router.stack.length) {
        this._app._router.stack.splice(index, 1)
      }
    }
  }
}

export default HttpServer
