import path from 'path'
import fs from 'fs'
import request from 'request'
import DecompressZip from 'decompress-zip'
import DdnCrypto from '@ddn/crypto'
import Asset from '@ddn/asset-base'
import Sandbox from '@ddn/sandbox'
import DdnUtils, { assetTypes } from '@ddn/utils'
import valid_url from 'valid-url'
import ByteBuffer from 'bytebuffer'
import dappCategory from './dapp/dapp-category.js'

const WITNESS_CLUB_DAPP_NAME = 'DDN-FOUNDATION'

const _dappInstalling = {}
const _dappRemoving = {}
const _dappLaunched = {}
const _dappLaunchedLastError = {}
const _dappready = {}
const modules = {}

class Dapp extends Asset.Base {
  // eslint-disable-next-line no-useless-constructor
  constructor (context, transactionConfig) {
    super(context, transactionConfig)

    this._context = context
    this.appPath = (context && context.baseDir) || path.resolve(__dirname, './')
    this.dappsPath = (context && context.config && context.config.dappsDir) || path.join(this.appPath, 'dapps')
  }

  async propsMapping () {
    return [
      {
        field: 'str1',
        prop: 'name',
        required: true
      },
      {
        field: 'str6',
        prop: 'description'
      },
      {
        field: 'str7',
        prop: 'tags'
      },
      {
        field: 'str8',
        prop: 'link',
        required: true
      },
      {
        field: 'int1',
        prop: 'type',
        required: true
      },
      {
        field: 'int2',
        prop: 'category',
        required: true
      },
      {
        field: 'str9',
        prop: 'icon'
      },
      {
        field: 'str_ext',
        prop: 'delegates',
        required: true
      },
      {
        field: 'int3',
        prop: 'unlock_delegates',
        required: true
      }
    ]
  }

  async create (data, trs) {
    trs.recipientId = null
    trs.amount = '0'

    const assetJsonName = await this.getAssetJsonName(trs.type)
    // eslint-disable-next-line require-atomic-updates
    trs.asset[assetJsonName] = data[assetJsonName]

    return trs
  }

  async calculateFee () {
    return DdnUtils.bignum.multiply(this.constants.net.fees.dapp, this.constants.fixedPoint)
  }

  async verify (trs) {
    const dapp = await this.getAssetObject(trs)
    if (trs.recipientId) {
      throw new Error('Invalid recipient')
    }

    if (!DdnUtils.bignum.isZero(trs.amount)) {
      throw new Error('Invalid transaction amount')
    }

    if (!dapp.category) {
      throw new Error('Invalid dapp category')
    }

    let foundCategory = false
    for (const i in dappCategory) {
      if (dappCategory[i] === dapp.category) {
        foundCategory = true
        break
      }
    }

    if (!foundCategory) {
      throw new Error('Unknown dapp category')
    }

    if (dapp.icon) {
      if (!valid_url.isUri(dapp.icon)) {
        throw new Error('Invalid icon link')
      }

      const { length } = dapp.icon

      if (
        dapp.icon.indexOf('.png') !== length - 4 &&
        dapp.icon.indexOf('.jpg') !== length - 4 &&
        dapp.icon.indexOf('.jpeg') !== length - 5
      ) {
        throw new Error('Invalid icon file type')
      }

      if (dapp.icon.length > 160) {
        throw new Error('Dapp icon url is too long. Maximum is 160 characters')
      }
    }

    if (dapp.type > 1 || dapp.type < 0) {
      throw new Error('Invalid dapp type')
    }

    if (!valid_url.isUri(dapp.link)) {
      throw new Error('Invalid dapp link')
    }

    if (dapp.link.indexOf('.zip') !== dapp.link.length - 4) {
      throw new Error('Invalid dapp file type')
    }

    if (dapp.link.length > 160) {
      throw new Error('Dapp link is too long. Maximum is 160 characters')
    }

    // todo: 2020.12 添加 name 唯一性的验证
    if (!dapp.name || dapp.name.trim().length === 0 || dapp.name.trim() !== dapp.name) {
      throw new Error('Missing dapp name')
    }

    if (dapp.name.length > 32) {
      throw new Error('Dapp name is too long. Maximum is 32 characters')
    }

    if (dapp.description && dapp.description.length > 160) {
      throw new Error('Dapp description is too long. Maximum is 160 characters')
    }

    if (dapp.tags && dapp.tags.length > 160) {
      throw new Error('Dapp tags is too long. Maximum is 160 characters')
    }

    if (dapp.tags) {
      let tags = dapp.tags.split(',')

      tags = tags.map(tag => tag.trim()).sort()

      for (let i = 0; i < tags.length - 1; i++) {
        if (tags[i + 1] === tags[i]) {
          throw new Error(`Encountered duplicate tags: ${tags[i]}`)
        }
      }
    }

    let delegatesArr = []
    if (!dapp.delegates) {
      throw new Error('Have no dapp delegates')
    } else {
      delegatesArr = typeof dapp.delegates === 'string' ? dapp.delegates.split(',') : dapp.delegates
      if (delegatesArr.length < 5 || delegatesArr.length > this.constants.delegates) {
        throw new Error('Invalid dapp delegates amount')
      }

      for (const i in delegatesArr) {
        if (delegatesArr[i].length !== 64) {
          throw new Error('Invalid dapp delegates format')
        }
      }
    }

    if (!dapp.unlock_delegates || dapp.unlock_delegates < 3 || dapp.unlock_delegates > delegatesArr.length) {
      throw new Error('Invalid unlock delegates number')
    }

    const data1 = await super.queryAsset({ name: dapp.name }, false, false, 1, 1)
    if (data1.length > 0) {
      throw new Error(`Dapp name already exists: ${dapp.name}`)
    }

    const data2 = await super.queryAsset({ link: dapp.link }, false, false, 1, 1)
    if (data2.length > 0) {
      throw new Error(`Dapp link already exists: ${dapp.link}`)
    }

    return trs
  }

  async getBytes (trs) {
    const { dapp } = trs.asset
    let buf = Buffer.from([])
    const nameBuf = Buffer.from(dapp.name, 'utf8')
    buf = Buffer.concat([buf, nameBuf])

    if (dapp.description) {
      const descriptionBuf = Buffer.from(dapp.description, 'utf8')
      buf = Buffer.concat([buf, descriptionBuf])
    }

    if (dapp.tags) {
      const tagsBuf = Buffer.from(dapp.tags, 'utf8')
      buf = Buffer.concat([buf, tagsBuf])
    }

    if (dapp.link) {
      buf = Buffer.concat([buf, Buffer.from(dapp.link, 'utf8')])
    }

    if (dapp.icon) {
      buf = Buffer.concat([buf, Buffer.from(dapp.icon, 'utf8')])
    }

    const bb = new ByteBuffer(1, true)
    bb.writeInt(dapp.type)
    bb.writeInt(dapp.category)
    if (dapp.delegates) {
      if (dapp.delegates instanceof Array) {
        dapp.delegates = dapp.delegates.join(',')
      }

      bb.writeString(dapp.delegates)
    }
    if (dapp.unlock_delegates || dapp.unlock_delegates === 0) {
      bb.writeInt(dapp.unlock_delegates)
    }
    bb.flip()

    buf = Buffer.concat([buf, bb.toBuffer()])

    return buf
  }

  async apply (trs) {
    const assetObj = await this.getAssetObject(trs)
    if (assetObj.name === WITNESS_CLUB_DAPP_NAME) {
      global.state.clubInfo = assetObj
      global.state.clubInfo.transactionId = trs.id
    }
  }

  async undo (trs, block, _, dbTrans) {
    const assetObj = await this.getAssetObject(trs)
    if (assetObj.name === WITNESS_CLUB_DAPP_NAME) {
      global.state.clubInfo = null
    }
    super.undo(trs, block, _, dbTrans)
  }

  async applyUnconfirmed (trs) {
    const assetObj = await this.getAssetObject(trs)

    if (this.oneoff.has(assetObj.name.toLowerCase())) {
      throw new Error('Dapp name already exists')
    }

    if (assetObj.link && this.oneoff.has(assetObj.link.toLowerCase())) {
      throw new Error('Dapp link already exists')
    }

    this.oneoff.set(assetObj.name.toLowerCase(), true)
    this.oneoff.set(assetObj.link.toLowerCase(), true)
  }

  async undoUnconfirmed (trs) {
    const assetObj = await this.getAssetObject(trs)
    this.oneoff.delete(assetObj.name.toLowerCase())
    this.oneoff.delete(assetObj.link.toLowerCase())
  }

  async dbRead (raw) {
    const result = await super.dbRead(raw)
    return result
  }

  async dbSave (trs, dbTrans) {
    const self = this
    await super.dbSave(trs, dbTrans)

    setImmediate(async () => {
      try {
        await this.runtime.socketio.emit('dapps/change', {})
      } catch (err) {
        self.logger.error('socket emit error: dapps/change')
      }
    })
  }

  async attachApi (router) {
    const self = this
    router.put('/', async (req, res) => {
      try {
        const result = await self.putDapp(req)
        res.json(result)
      } catch (err) {
        res.json({ success: false, error: err.message || err.toString() })
      }
    })

    router.get('/', async (req, res) => {
      try {
        const result = await self.getDappList(req, res)
        res.json(result)
      } catch (err) {
        res.json({ success: false, error: err.message || err.toString() })
      }
    })

    // 2020.4.21 验证: 使用 get api/dapps/get -> get api/dapps/:id ?
    router.get('/dappId/:id', async (req, res) => {
      try {
        const result = await self.getDappById(req)
        res.json(result)
      } catch (err) {
        res.json({ success: false, error: err.message || err.toString() })
      }
    })

    router.get('/installedIds', async (req, res) => {
      try {
        const result = await self.getInstalledDappIds()
        res.json({ success: true, ids: result })
      } catch (err) {
        res.json({ success: false, error: err.message || err.toString() })
      }
    })

    router.get('/installed', async (req, res) => {
      try {
        const result = await self.getInstalled()
        res.json(result)
      } catch (err) {
        res.json({ success: false, error: err.message || err.toString() })
      }
    })

    router.post('/install', async (req, res) => {
      try {
        const result = await self.postInstallDapp(req, res)
        res.json(result)
      } catch (err) {
        res.json({ success: false, error: err.message || err.toString() })
      }
    })

    router.post('/uninstall', async (req, res) => {
      try {
        const result = await self.postUninstallDapp(req, res)
        res.json(result)
      } catch (err) {
        res.json({ success: false, error: err.message || err.toString() })
      }
    })

    router.post('/launch', async (req, res) => {
      try {
        const result = await self.postLaunchDapp(req, res)
        res.json(result)
      } catch (err) {
        res.json({ success: false, error: err.message || err.toString() })
      }
    })

    router.get('/launch/lasterror', async (req, res) => {
      try {
        const result = await self.getLaunchDappLastError(req, res)
        res.json(result)
      } catch (err) {
        res.json({ success: false, error: err.message || err.toString() })
      }
    })

    router.post('/stop', async (req, res) => {
      try {
        const result = await self.postStopDapp(req, res)
        res.json(result)
      } catch (err) {
        res.json({ success: false, error: err.message || err.toString() })
      }
    })

    router.get('/installing', async (req, res) => {
      try {
        const ids = []
        for (const dappId in _dappInstalling) {
          ids.push(dappId)
        }

        return res.json({ success: true, installing: ids })
      } catch (err) {
        res.json({ success: false, error: err.message || err.toString() })
      }
    })

    router.get('/removing', async (req, res) => {
      try {
        const ids = []
        for (const dappId in _dappRemoving) {
          ids.push(dappId)
        }

        return res.json({ success: true, removing: ids })
      } catch (err) {
        res.json({ success: false, error: err.message || err.toString() })
      }
    })

    router.get('/launched', async (req, res) => {
      try {
        const ids = []
        for (const dappId in _dappLaunched) {
          ids.push(dappId)
        }

        return res.json({ success: true, launched: ids })
      } catch (err) {
        res.json({ success: false, error: err.message || err.toString() })
      }
    })

    router.get('/categories', async (req, res) => {
      try {
        res.json({ success: true, categories: dappCategory })
      } catch (err) {
        res.json({ success: false, error: err.message || err.toString() })
      }
    })

    router.get('/balances/:dappid', async (req, res) => {
      try {
        const result = await self.getDappBalances(req)
        res.json(result)
      } catch (err) {
        res.json({ success: false, error: err.message || err.toString() })
      }
    })

    router.get('/balances/:dappid/:currency', async (req, res) => {
      try {
        const result = await self.getDappBalance(req)
        res.json(result)
      } catch (err) {
        self.logger.error('getDappBalance err', err)
        res.json({ success: false, error: err.message || err.toString() })
      }
    })
  }

  async getDappBalances (req) {
    const dappId = req.params.dappid
    const limit = req.query.limit || 100
    const offset = req.query.offset || 0

    const rows = await this.dao.findPage('mem_asset_balance', {
      where: { address: dappId },
      limit,
      offset,
      attributes: ['currency', 'balance']
    })
    return { success: true, result: rows }
  }

  async getDappBalance (req) {
    const dappId = req.params.dappid
    const { currency } = req.params

    const row = await this.dao.findOne('mem_asset_balance', {
      where: { address: dappId, currency },
      attributes: ['balance']
    })
    return { success: true, result: { currency, balance: row.balance } }
  }

  async getLaunchDappLastError (req) {
    const { query } = req

    const validateErrors = await this.ddnSchema.validate(
      {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            minLength: 1
          },
          master: {
            type: 'string',
            minLength: 0
          }
        },
        required: ['id']
      },
      query
    )
    if (validateErrors) {
      throw new Error(`Invalid parameters: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`)
    }

    if (this.config.dapp.masterpassword && query.master !== this.config.dapp.masterpassword) {
      throw new Error('Invalid master password')
    }

    if (_dappLaunchedLastError[query.id]) {
      return { success: true, error: _dappLaunchedLastError[query.id] }
    }
    return { success: true }
  }

  async postLaunchDapp (req) {
    const { body } = req

    const validateErrors = await this.ddnSchema.validate(
      {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            minLength: 1
          },
          params: {
            type: 'array',
            minLength: 1
          },
          master: {
            type: 'string',
            minLength: 0
          }
        },
        required: ['id']
      },
      body
    )
    if (validateErrors) {
      throw new Error(`Invalid parameters: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`)
    }

    if (this.config.dapp.masterpassword && body.master !== this.config.dapp.masterpassword) {
      throw new Error('Invalid master password')
    }

    await this.symlink(body.id)
    await this.runDapp(body.id, body.params)

    await this.runtime.socketio.emit('dapps/change', {})

    return { success: true }
  }

  async _readDappConfig (dappPath) {
    const configFile = path.join(dappPath, 'config.json')

    return new Promise((resolve, reject) => {
      fs.readFile(configFile, 'utf8', (err, data) => {
        if (err) {
          return reject(err)
        }
        try {
          const configObj = JSON.parse(data)
          return resolve(configObj)
        } catch (err2) {
          return reject(err2)
        }
      })
    })
  }

  async runDapp (id, args) {
    if (_dappLaunched[id]) {
      throw new Error('Dapp already launched')
    }

    delete _dappLaunchedLastError[id]

    args = args || []

    const dapp = await this.getDappByTransactionId(id)
    const installedIds = await this.getInstalledDappIds()
    if (installedIds.indexOf(id) < 0) {
      throw new Error('Dapp not installed')
    }

    const dappPath = path.join(this.config.dappsDir, id)

    let dappConfig
    try {
      dappConfig = await this._readDappConfig(dappPath)
    } catch (err) {
      throw new Error(`Failed to read config.json file for: ${id}`)
    }

    if (dappConfig.peers && dappConfig.peers.length) {
      for (let i = 0; i < dappConfig.peers.length; i++) {
        const peerItem = dappConfig.peers[i]
        await this.runtime.peer.addDapp({ ...peerItem, dappId: id })
      }
    }

    const sandbox = new Sandbox(dappPath, dapp, args, this.apiHandler, true, this.logger)

    // eslint-disable-next-line require-atomic-updates
    _dappLaunched[id] = sandbox

    const self = this
    sandbox.on('exit', function (code) {
      self.logger.info('Dapp ' + id + ' exited with code ' + code)
      try {
        // self.stopDapp(dapp)
      } catch (error) {
        self.logger.error('Encountered error while stopping dapp: ' + error)
      }
    })

    sandbox.on('error', function (err) {
      self.logger.info('Encountered error in dapp ' + id + ' ' + err.toString())
      try {
        self.stopDapp(dapp)
      } catch (error) {
        self.logger.error('Encountered error while stopping dapp: ' + error)
      }
    })

    sandbox.run()

    await this._attachDappFrameworkApi(dapp)
    await this._addLaunchedMarkFile(dappPath)
  }

  async _getLaunchedMarkFile (dappPath) {
    const file = path.join(dappPath, 'dapp.pid')
    return file
  }

  /**
   * 增加运行标记文件
   */
  async _addLaunchedMarkFile (dappPath) {
    const file = await this._getLaunchedMarkFile(dappPath)
    if (!fs.existsSync(file)) {
      try {
        const fd = fs.openSync(file, 'wx')
        fs.writeSync(fd, process.pid)
        fs.closeSync(fd)
      } catch (err) {
        this.logger.warn(err)
      }
    }
  }

  /**
   * 移除运行标记文件
   */
  async _removeLaunchedMarkFile (dappPath) {
    const file = await this._getLaunchedMarkFile(dappPath)
    if (fs.existsSync(file)) {
      try {
        fs.unlinkSync(file)
      } catch (err) {
        this.logger.warn(err)
      }
    }
  }

  async _readDappRouters (dappPath) {
    const routerFile = path.join(dappPath, 'routers.json')

    return new Promise((resolve, reject) => {
      fs.readFile(routerFile, 'utf8', (err, data) => {
        if (err) {
          return reject(err)
        }
        try {
          const routersObj = JSON.parse(data)
          return resolve(routersObj)
        } catch (err2) {
          return reject(err2)
        }
      })
    })
  }

  /**
   * 将侧链的默认接口加载上来
   * @param {string} dapp Dapp trs object
   */
  async _attachDappFrameworkApi (dapp) {
    const self = this
    const id = dapp.transaction_id
    const name = dapp.name
    const dappRouter = self.runtime.httpserver.dappRouter

    const routers = Sandbox.routes
    if (routers && routers.length > 0) {
      for (const router of routers) {
        // const router = routers[i]
        if (router.method && router.path) {
          try {
            const handler = async function (req, res) {
              try {
                const result = await new Promise((resolve, reject) => {
                  const reqParams = {
                    query: router.method === 'get' ? req.query : req.body,
                    params: req.params
                  }

                  self.request(id, router.method, router.path, reqParams, function (err, body) {
                    if (!err && body.error) {
                      err = body.error
                    }
                    if (err) {
                      body = { error: err.toString() }
                    }
                    body.success = !err
                    res.json(body)
                  })
                })
                res.json({ success: true, result })
              } catch (err) {
                res.json({ success: false, error: `${err}` })
              }
            }

            dappRouter[router.method](`/${id}${router.path}`, handler)
            dappRouter[router.method](`/${name}${router.path}`, handler)
          } catch (error) {
            self.logger.error(`${router.method} /dapps/${id}${router.path} fail `, error)
          }
        }
      }
      self.logger.debug('Dapp`s APIs have been attached. ')
    }
  }

  request (dappId, method, path, query, cb) {
    const sandbox = _dappLaunched[dappId]
    if (!sandbox) {
      return cb('Dapp not found')
    }

    sandbox.sendMessage(
      {
        method: method,
        path: path,
        query: query
      },
      cb
    )
  }

  async postStopDapp (req) {
    const { body } = req

    const validateErrors = await this.ddnSchema.validate(
      {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            minLength: 1
          },
          master: {
            type: 'string',
            minLength: 0
          }
        },
        required: ['id']
      },
      body
    )

    if (validateErrors) {
      throw new Error(`Invalid parameters: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`)
    }

    if (this.config.dapp.masterpassword && body.master !== this.config.dapp.masterpassword) {
      throw new Error('Invalid master password')
    }

    const dapp = await this.getDappByTransactionId(body.id)
    await this.stopDapp(dapp)

    return { success: true }
  }

  async stopDapp (dapp) {
    if (!_dappLaunched[dapp.transaction_id]) {
      throw new Error('DApp not launched')
    }

    // _dappLaunched[dapp.transaction_id].stop()
    _dappLaunched[dapp.transaction_id].exit()
    this.runtime.socketio.emit('dapps/change', {})

    _dappLaunched[dapp.transaction_id] = null
    delete _dappLaunched[dapp.transaction_id]

    await this._detachDappApi(dapp.transaction_id)

    const dappPath = path.join(this.config.dappsDir, dapp.transaction_id)
    await this._removeLaunchedMarkFile(dappPath)
  }

  async _detachDappApi (id) {
    await this.runtime.httpserver.removeApiRouter(`/dapp/${id}`)
  }

  async getDappByTransactionId (trsId) {
    const result = await this.queryAsset({ trs_id: trsId }, null, false, 1, 1)
    if (result && result.length) {
      return result[0]
    }

    throw new Error(`DApp not found: ${trsId}`)
  }

  async getDappList (req) {
    const { query } = req

    const validateErrors = await this.ddnSchema.validate(
      {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            minLength: 1
          },
          name: {
            type: 'string',
            minLength: 1,
            maxLength: 32
          },
          type: {
            type: 'integer',
            minimum: 0
          },
          link: {
            type: 'string',
            maxLength: 2000,
            minLength: 1
          },
          icon: {
            type: 'string',
            minLength: 1
          },
          sort: {
            type: 'string',
            minLength: 1
          },
          pagesize: {
            type: 'integer',
            minimum: 0,
            maximum: 100
          },
          pageindex: {
            type: 'integer',
            minimum: 1
          }
        }
      },
      query
    )
    if (validateErrors) {
      throw new Error(`Invalid parameters: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`)
    }

    const where = {
      trs_type: await this.getTransactionType()
    }

    const orders = []

    let sort = query.sort || query.orderBy

    const parseSortItem = (orders, item) => {
      const subItems = item.split(':')
      if (subItems.length === 2) {
        if (subItems[0].replace(/\s*/, '') !== '') {
          orders.push(subItems)
        }
      }
    }

    if (sort) {
      if (!sort.splice) {
        sort = [sort]
      }

      for (let i = 0; i < sort.length; i++) {
        const sortItem = sort[i]
        if (sortItem.replace(/\s*/, '') !== '') {
          const pos = sortItem.indexOf(':')
          if (pos >= 0) {
            parseSortItem(orders, sortItem)
          } else {
            orders.push(sortItem)
          }
        }
      }
    }

    const pageIndex = query.pageindex || 1
    const pageSize = query.pagesize || 100

    delete query.sort
    delete query.pageindex
    delete query.pagesize

    const limit = query.limit || pageSize || 10
    const offset = query.offset || (pageIndex - 1) * pageSize

    const result = await this.queryAsset(where, orders, true, offset, limit)
    return { success: true, result }
  }

  // 支持 ?id=abc 和 /abc 两种格式
  async getDappById (req) {
    const query = req.params

    const validateErrors = await this.ddnSchema.validate(
      {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            minLength: 1
          }
        },
        required: ['id']
      },
      query
    )
    if (validateErrors) {
      throw new Error(`Invalid parameters: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`)
    }
    const dapp = await this.getDappByTransactionId(query.id)

    return { success: true, dapp }
  }

  checkDappPath () {
    if (!fs.existsSync(this.config.dappsDir)) {
      fs.mkdirSync(this.config.dappsDir)
    }
  }

  delDir (path) {
    let files = []
    const self = this

    if (fs.existsSync(path)) {
      files = fs.readdirSync(path)
      files.forEach(file => {
        const curPath = `${path}/${file}`
        if (fs.statSync(curPath).isDirectory()) {
          // recurse
          self.delDir(curPath)
        } else {
          // delete file
          fs.unlinkSync(curPath)
        }
      })
      fs.rmdirSync(path)
    }
  }

  async getInstalledDappIds () {
    const self = this

    self.checkDappPath()
    const files = fs.readdirSync(self.config.dappsDir)
    return files
  }

  async getInstalled () {
    const ids = await this.getInstalledDappIds()
    if (ids && ids.length) {
      const dapps = await this.queryAsset({ trs_id: { $in: ids } }, null, false, 1, ids.length)
      return { success: true, result: { rows: dapps } }
    }
    return { success: true, result: { rows: [] } }
  }

  async downloadDapp (source, target) {
    return new Promise((resolve, reject) => {
      const downloadRequest = request.get(source)

      downloadRequest.on('response', res => {
        if (res.statusCode !== 200) {
          return reject(new Error(`Faile to download dapp ${source} with err code: ${res.statusCode}`))
        }
      })

      downloadRequest.on('error', err => {
        if (fs.existsSync(target)) {
          fs.unlinkSync(target)
        }
        reject(new Error(`Failed to download dapp ${source} with error: ${err.message}`))
      })

      const file = fs.createWriteStream(target)
      file.on('finish', () => {
        file.close()
        resolve()
      })

      downloadRequest.pipe(file)
    })
  }

  async decompressDappZip (zippath, extractpath) {
    return new Promise((resolve, reject) => {
      const unzipper = new DecompressZip(zippath)

      unzipper.on('error', err => reject(new Error(`Failed to decompress zip file: ${err}`)))

      unzipper.on('extract', () => {
        resolve()
      })

      unzipper.extract({
        path: extractpath,
        strip: 1,
        filter: file => file.type !== 'Directory'
      })
    })
  }

  async installDApp (dapp) {
    const dappPath = path.join(this.config.dappsDir, dapp.transaction_id)

    if (!fs.existsSync(dappPath)) {
      throw new Error('Dapp is already installed')
    }

    fs.mkdirSync(dappPath)

    const dappPackage = path.join(dappPath, `${dapp.transaction_id}.zip`)

    try {
      await this.downloadDapp(dapp.link, dappPackage)
    } catch (err) {
      this.delDir(dappPath)
      throw new Error(err)
    }

    try {
      await this.decompressDappZip(dappPackage, dappPath)
    } catch (err) {
      this.delDir(dappPath)
      throw new Error(err)
    }

    return dappPath
  }

  async removeDapp (dapp) {
    const dappPath = path.join(this.config.dappsDir, dapp.transaction_id)

    if (!fs.existsSync(dappPath)) {
      throw new Error(`Dapp not installed: ${dapp.transaction_id}`)
    }

    this.delDir(dappPath)
  }

  async postUninstallDapp (req, res) {
    const { body } = req

    const validateErrors = await this.ddnSchema.validate(
      {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            minLength: 1
          },
          master: {
            type: 'string',
            minLength: 1
          }
        },
        required: ['id']
      },
      body
    )
    if (validateErrors) {
      throw new Error(`Invalid parameters: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`)
    }

    if (this.config.dapp.masterpassword && body.master !== this.config.dapp.masterpassword) {
      throw new Error('Invalid master password')
    }

    if (_dappRemoving[body.id] || _dappInstalling[body.id]) {
      throw new Error('This DApp already on uninstall/loading')
    }

    _dappRemoving[body.id] = true

    const dapp = await this.getDappByTransactionId(body.id)

    if (_dappLaunched[body.id]) {
      await this.stopDapp(dapp)
      // eslint-disable-next-line require-atomic-updates
      _dappLaunched[body.id] = false
    }

    try {
      await this.removeDapp(dapp)

      await this.runtime.socketio.emit('dapps/change', {})
      return res.json({ success: true })
    } finally {
      // eslint-disable-next-line require-atomic-updates
      _dappRemoving[body.id] = false
    }
  }

  async postInstallDapp (req, res) {
    const { body } = req

    const validateErrors = await this.ddnSchema.validate(
      {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            minLength: 1
          },
          master: {
            type: 'string',
            minLength: 1
          }
        },
        required: ['id']
      },
      body
    )
    if (validateErrors) {
      throw new Error(`Invalid parameters: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`)
    }

    if (this.config.dapp.masterpassword && body.master !== this.config.dapp.masterpassword) {
      throw new Error('Invalid master password')
    }

    const installedDappIds = await this.getInstalledDappIds()
    if (installedDappIds.indexOf(body.id) >= 0) {
      throw new Error('This dapp already installed')
    }

    if (_dappRemoving[body.id] || _dappInstalling[body.id]) {
      throw new Error('This DApp already on downloading/removing')
    }

    _dappInstalling[body.id] = true

    try {
      const dapp = await this.getDappByTransactionId(body.id)
      const dappPath = await this.installDApp(dapp)

      await this._removeLaunchedMarkFile(dappPath)

      await this.runtime.socketio.emit('dapps/change', {})
      return res.json({ success: true, path: dappPath })
    } finally {
      // eslint-disable-next-line require-atomic-updates
      _dappInstalling[body.id] = false
    }
  }

  async putDapp (req) {
    const { body } = req

    const validateErrors = await this.ddnSchema.validate(
      {
        type: 'object',
        properties: {
          secret: {
            type: 'string',
            minLength: 1
          },
          secondSecret: {
            type: 'string',
            minLength: 1
          },
          publicKey: {
            type: 'string',
            format: 'publicKey'
          },
          category: {
            type: 'integer',
            minimum: 0
          },
          name: {
            type: 'string',
            minLength: 1,
            maxLength: 32
          },
          description: {
            type: 'string',
            minLength: 0,
            maxLength: 160
          },
          tags: {
            type: 'string',
            minLength: 0,
            maxLength: 160
          },
          type: {
            type: 'integer',
            minimum: 0
          },
          link: {
            type: 'string',
            maxLength: 2000,
            minLength: 1
          },
          icon: {
            type: 'string',
            minLength: 1,
            maxLength: 2000
          }
        },
        required: ['secret', 'type', 'name', 'category']
      },
      body
    )
    if (validateErrors) {
      throw new Error(`Invalid parameters: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`)
    }

    const keypair = DdnCrypto.getKeys(body.secret)

    if (body.publicKey) {
      if (keypair.publicKey.toString('hex') !== body.publicKey) {
        throw new Error('Invalid passphrase')
      }
    }

    return new Promise((resolve, reject) => {
      this.balancesSequence.add(
        async cb => {
          let account
          try {
            account = await this.runtime.account.getAccountByPublicKey(keypair.publicKey.toString('hex'))
          } catch (e) {
            return cb(e)
          }

          if (!account) {
            return cb('Account not found')
          }

          if (account.second_signature && !body.secondSecret) {
            return cb(new Error('Invalid second passphrase'))
          }

          let second_keypair = null
          if (account.secondSignature) {
            second_keypair = DdnCrypto.getKeys(body.secondSecret)
          }

          try {
            const data = {
              type: await this.getTransactionType(),
              sender: account,
              keypair,
              second_keypair
            }
            const assetJsonName = await this.getAssetJsonName()
            data[assetJsonName] = {
              category: body.category,
              name: body.name,
              description: body.description,
              tags: body.tags,
              type: body.type,
              link: body.link,
              icon: body.icon,
              delegates: body.delegates,
              unlock_delegates: body.unlock_delegates
            }

            const transaction = await this.runtime.transaction.create(data)
            const transactions = await this.runtime.transaction.receiveTransactions([transaction])

            cb(null, transactions)
          } catch (e) {
            cb(e)
          }
        },
        (err, transactions) => {
          if (err) {
            return reject(err)
          }

          resolve({ success: true, transactionId: transactions[0].id })
        }
      )
    })
  }

  // 提供给 ddn-sandbox 的 modules 变量
  async onBind () {
    modules.dapp = this
    modules.blocks = this.runtime.block
    modules.transport = this.runtime.peer
    modules.transactions = this.runtime.transaction
    modules.accounts = this.runtime.account
    modules.delegates = this.runtime.delegate
    modules.multisignatures = this.runtime.multisignature
    modules.transactions = this.runtime.transaction
  }

  async onBlockchainReady () {
    const installIds = await this.getInstalledDappIds()
    console.log(installIds)
    for (let i = 0; i < installIds.length; i++) {
      const dappId = installIds[i]
      const dappPath = path.join(this.config.dappsDir, dappId)
      const file = await this._getLaunchedMarkFile(dappPath)
      if (fs.existsSync(file)) {
        await this.symlink(dappId)
        await this.runDapp(dappId) // wxm params
      }
    }
  }

  async onNewBlock (block, votes, broadcast) {
    const self = this
    // console.log('onNewBlock',block)
    const req = {
      query: {
        topic: 'point',
        message: { id: block.id, height: block.height }
      }
    }
    Object.keys(_dappLaunched).forEach(function (dappId) {
      console.log('request', dappId, broadcast)
      // broadcast &&
      self.request(dappId, 'post', '/message', req, function (err) {
        if (err) {
          self.logger.error('onNewBlock message', err)
        }
      })
    })
  }

  async symlink (dappId) {
    const dappPath = path.join(this.dappsPath, dappId)
    const dappPublicPath = path.resolve(dappPath, 'public')
    const dappPublicLink = path.resolve(this.appPath, 'public', 'dist', 'dapps', dappId)
    const dappPublicLink0 = path.resolve(this.appPath, 'public', 'dist', 'dapps')

    if (fs.existsSync(dappPublicPath)) {
      if (!fs.existsSync(dappPublicLink)) {
        fs.mkdirSync(dappPublicLink0, { recursive: true })
        fs.symlinkSync(dappPublicPath, dappPublicLink)
      }
    }
  }

  apiHandler (message, callback) {
    try {
      const strs = message.call.split('#')
      const module = strs[0]
      const call = strs[1]
      this.logger.debug('module is ', module)

      if (!modules[module]) {
        return setImmediate(callback, 'Invalid module in call: ' + message.call)
      }
      if (!modules[module].sandboxApi) {
        return setImmediate(callback, 'This module have no sandbox api')
      }
      modules[module].sandboxApi(
        call,
        { body: message.args, dappId: message.dappId, dappName: message.dappName },
        callback
      )
    } catch (e) {
      return setImmediate(callback, 'Invalid call ' + e.toString())
    }
  }

  sandboxApi (call, args, cb) {
    // sandboxHelper.callMethod(shared, call, args, cb)
    if (typeof this[call] !== 'function') {
      return cb(`Function not found in module: ${call}`)
    }
    console.log('sandboxApi', call, args)
    const callArgs = [args, cb]
    return this[call].apply(this, callArgs)
  }

  async getDapp (req, cb) {
    const dapp = await this.getDappByTransactionId(req.dappId)
    return cb(null, dapp)
  }

  setReady (req, cb) {
    _dappready[req.dappId] = true
    cb(null, {})
  }

  registerInterface (req, cb) {
    const self = this
    const dappId = req.dappId
    const dappName = req.dappName
    const method = req.body.method
    const path = req.body.path
    const handler = function (req, res) {
      const reqParams = {
        query: method === 'get' ? req.query : req.body,
        params: req.params
      }
      self.request(dappId, method, path, reqParams, function (err, body) {
        if (!body) {
          body = {}
        }
        if (!err && body.error) {
          err = body.error
        }
        if (err) {
          body = { error: err.toString() }
        }
        body.success = !err
        res.json(body)
      })
    }
    const dappRouter = self.runtime.httpserver.dappRouter
    dappRouter[method](`/${dappId}${path}`, handler)
    dappRouter[method](`/${dappName}${path}`, handler)
    cb(null)
  }

  onDeleteBlocksBefore (block) {
    const self = this
    Object.keys(_dappLaunched).forEach(function (dappId) {
      const req = {
        query: {
          topic: 'rollback',
          message: { pointId: block.id, pointHeight: block.height }
        }
      }
      self.request(dappId, 'post', '/message', req, function (err) {
        if (err) {
          self.logger.error('onDeleteBlocksBefore message', err)
        }
      })
    })
  }

  // Shared
  async getGenesis (req) {
    const rows = await this.dao.execSql(
      `SELECT b.height as height, b.id as id, GROUP_CONCAT(m.dependentId) as multisignature, t.senderId as authorId FROM trs t 
    inner join blocks b on t.blockId = b.id and t.id = ? 
    left outer join mem_accounts2multisignatures m on m.accountId = t.senderId and t.id = ?`,
      {
        replacements: [req.dappId, req.dappId]
        // type: sequelize.QueryTypes.SELECT
      }
    )
    if (!rows.length) {
      throw new Error('Database error')
    }

    return {
      pointId: rows[0].id,
      pointHeight: rows[0].height,
      authorId: rows[0].authorId,
      dappId: req.dappId,
      associate: rows[0].multisignature ? rows[0].multisignature.split(',') : []
    }
  }

  // getDApp = function (req, cb) {
  //   library.model.getDAppById(req.dappId, cb)
  // }

  async getCommonBlock (req) {
    return await this.dao.execSql(
      'SELECT b.height as height, t.id as id, t.senderId as senderId, t.amount as amount FROM trs t inner join blocks b on t.blockId = b.id and t.id = ? and t.type = ? inner join intransfer dt on dt.transactionId = t.id and dt.dappId = ?',
      {
        replacements: [req.dappId, assetTypes.DAPP_IN, req.dappId]
        // type: sequelize.QueryTypes.SELECT
      }
    )
  }

  async sendWithdrawal (req, cb) {
    const self = this
    const body = req.body
    const validateErrors = await this.ddnSchema.validate(
      {
        type: 'object',
        properties: {
          secret: {
            type: 'string',
            minLength: 1,
            maxLength: 100
          },
          amount: {
            type: 'integer',
            minimum: 1,
            maximum: this.constants.totalAmount
          },
          recipientId: {
            type: 'string',
            minLength: 1,
            maxLength: 50
          },
          secondSecret: {
            type: 'string',
            minLength: 1,
            maxLength: 100
          },
          transactionId: {
            type: 'string',
            minLength: 1,
            maxLength: 64
          },
          multisigAccountPublicKey: {
            type: 'string',
            format: 'publicKey'
          }
        },
        required: ['secret', 'recipientId', 'amount', 'transactionId']
      },
      body
    )

    if (validateErrors) {
      return cb(validateErrors)
    }

    // var hash = crypto.createHash('sha256').update(body.secret, 'utf8').digest();
    // var keypair = ed.MakeKeypair(hash);
    const keypair = DdnCrypto.getKeys(body.secondSecret)
    // let query = {};

    if (!this.address.isAddress(body.recipientId)) {
      return cb('Invalid address')
    }

    self.balancesSequence.add(
      async function (cb) {
        if (body.multisigAccountPublicKey && body.multisigAccountPublicKey !== keypair.publicKey) {
          try {
            const account = await modules.accounts.getAccount({ publicKey: body.multisigAccountPublicKey })
            if (!account) {
              return cb('Multisignature account not found')
            }

            if (!account.multisignatures || !account.multisignatures) {
              return cb('Account does not have multisignatures enabled')
            }

            if (account.multisignatures.indexOf(keypair.publicKey) < 0) {
              return cb('Account does not belong to multisignature group')
            }

            const requester = await modules.accounts.getAccount({ publicKey: keypair.publicKey })

            if (!requester || !requester.publicKey) {
              return cb('Invalid requester')
            }

            if (requester.secondSignature && !body.secondSecret) {
              return cb('Invalid second passphrase')
            }

            if (requester.publicKey === account.publicKey) {
              return cb('Invalid requester')
            }

            let secondKeypair = null

            if (requester.secondSignature) {
              // let secondHash = crypto.createHash('sha256').update(body.secondSecret, 'utf8').digest();
              // secondKeypair = ed.MakeKeypair(secondHash);
              secondKeypair = DdnCrypto.getKeys(body.secondSecret)
            }

            const transaction = this.runtime.transaction.create({
              type: assetTypes.DAPP_OUT,
              amount: body.amount,
              sender: account,
              recipientId: body.recipientId,
              keypair: keypair,
              secondKeypair: secondKeypair,
              requester: keypair,
              dappId: req.dappId,
              transactionId: body.transactionId
            })
            modules.transactions.receiveTransactions([transaction], cb)
          } catch (err) {
            return cb(err.toString())
          }
        } else {
          try {
            const account = await modules.accounts.getAccount({ publicKey: keypair.publicKey })
            if (!account) {
              return cb('Account not found')
            }

            if (account.secondSignature && !body.secondSecret) {
              return cb('Invalid second passphrase')
            }

            let secondKeypair = null

            if (account.secondSignature) {
              // var secondHash = crypto.createHash('sha256').update(body.secondSecret, 'utf8').digest();
              // secondKeypair = ed.MakeKeypair(secondHash);
              secondKeypair = DdnCrypto.getKeys(body.secondSecret)
            }

            const transaction = modules.transactions.create({
              type: assetTypes.DAPP_OUT,
              amount: body.amount,
              sender: account,
              recipientId: body.recipientId,
              keypair: keypair,
              secondKeypair: secondKeypair,
              dappId: req.dappId,
              transactionId: body.transactionId
            })

            modules.transactions.receiveTransactions([transaction], cb)
          } catch (err) {
            if (err) {
              return cb(err.toString())
            }
          }
        }
      },
      function (err, transaction) {
        if (err) {
          return cb(err.toString())
        }

        cb(null, { transactionId: transaction[0].id })
      }
    )
  }

  async getWithdrawalLastTransaction (req, cb) {
    const rows = await this.dao.execSql(
      'SELECT ot.outTransactionId as id FROM trs t inner join blocks b on t.blockId = b.id and t.type = ? inner join outtransfer ot on ot.transactionId = t.id and ot.dappId = ? order by b.height desc limit 1',
      {
        replacements: [assetTypes.DAPP_OUT, req.dappId]
      }
    )
    return rows && rows[0]
  }

  async getBalanceTransactions (req) {
    const replacements = [assetTypes.DAPP_IN, req.dappId]
    if (req.body.lastTransactionId) replacements.push(req.body.lastTransactionId)
    return await this.dao.execSql(
      `SELECT t.id as id, lower(hex(t.senderPublicKey)) as senderPublicKey, t.amount as amount, dt.currency as currency, dt.amount as amount2 FROM trs t 
    inner join blocks b on t.blockId = b.id and t.type = ? 
    inner join intransfer dt on dt.transactionId = t.id and dt.dappId = ?
    ${
      req.body.lastTransactionId
        ? 'where b.height > (select height from blocks ib inner join trs it on ib.id = it.blockId and it.id = ?) '
        : ''
    }
    order by b.height`,
      {
        replacements
      }
    )
  }

  submitOutTransfer (req, cb) {
    const self = this
    const trs = req.body
    self.balancesSequence.add(function (cb) {
      if (modules.transactions.hasUnconfirmedTransaction(trs)) {
        return cb('Already exists')
      }
      self.logger.log('Submit outtransfer transaction ' + trs.id + ' from dapp ' + req.dappId)
      modules.transactions.receiveTransactions([trs], cb)
    }, cb)
  }

  // TODO will delete or complete (要么完善这个方法，要么在侧链里去掉该方法的调用,这里是同步充值侧链token的方法需要完善)
  async getDeposits (req, cb) {
    // const that=this
    // TODO 这里查询的是dapp充值交易，能不能直接查询dapp资产表
    const data = await this.runtime.dataquery.loadAssetsWithDappChainCondition({
      seq: req.body.seq,
      dapp_id: req.dappId,
      type: DdnUtils.assetTypes.DAPP_IN
    })
    const transactions = []
    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const trs = await this.runtime.transaction.serializeDbData2Transaction(row)
      transactions.push(trs)
    }
    // const data=  await new Promise(function (resolve) {

    //   that.dao.findList('tr', {
    //     block_height: {
    //       $gte: req.body.seq
    //     },
    //     type:6
    //   }, null, null, function (err, rows) {
    //     if (err) {
    //       resolve(err);
    //     } else {
    //       resolve(rows);
    //     }
    //   });
    //   });
    console.log(transactions)
    cb(null, transactions)
  }

  getLastWithdrawal = async function (req, cb) {
    // const that = this
    const dapp_id = req.dappId
    // TODO 这里查询的是dapp充值交易，能不能直接查询dapp资产表
    const data = await this.runtime.dataquery.loadAssetsWithDappChainCondition({
      dapp_id,
      type: DdnUtils.assetTypes.DAPP_OUT
    })
    const transactions = []
    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const trs = await this.runtime.transaction.serializeDbData2Transaction(row)
      transactions.push(trs)
    }
    // const data=  await new Promise(function (resolve) {

    //   that.dao.findList('tr', {
    //     block_height: {
    //       $gte: req.body.seq
    //     },
    //     type:6
    //   }, null, null, function (err, rows) {
    //     if (err) {
    //       resolve(err);
    //     } else {
    //       resolve(rows);
    //     }
    //   });
    //   });
    // console.log('withDraw', transactions[0].asset.dappOut, req)
    transactions.length > 0 ? cb(null, transactions[0]) : cb(null, null)
  }
}

export default Dapp
