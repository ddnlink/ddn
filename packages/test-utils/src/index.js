/* ---------------------------------------------------------------------------------------------
 *  Created by DDN Team on Thu Mar 15 2017 9:37:56
 *
 *  Copyright (c) 2019 DDN Foundation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

import chai, { expect } from 'chai'
import supertest from 'supertest'
import async from 'async'
import request from 'request'
import bluebird from 'bluebird'

import DdnUtils from '@ddn/utils'
import * as DdnCrypto from '@ddn/crypto'

import {
  randomProperty,
  randomName,
  randomDelegateName,
  randomCoin,
  randomPassword,
  randomAccount,
  randomTxAccount,
  randomUsername,
  randomIssuerName,
  randomNumber,
  randomizeSelection,
  randomOrgId,
  randomIpId
} from './random-utils'

import { accounts } from './account-utils'

// TODO 包的整理规划需要进一步明确原则，根据通用性确定是否写成npm包
import { DappCategory, DappType } from '@ddn/asset-dapp'

const { Daccount, Eaccount, Gaccount } = accounts

const assetTypes = DdnUtils.assetTypes
const bignum = DdnUtils.bignum

function PIFY (fn, receiver) {
  return (...args) =>
    new Promise((resolve, reject) => {
      fn.apply(receiver, [...args, (err, result) => (err ? reject(err) : resolve(result))])
    })
}

function EIFY (fn, receiver) {
  return (...args) =>
    new Promise((resolve, reject) => {
      fn.apply(receiver, [...args, (err, result) => resolve([err, result])])
    })
}

let _singleton

export class TestUtil {
  static singleton (context) {
    if (!_singleton) {
      _singleton = new TestUtil(context)
    }
    return _singleton
  }

  constructor (config, constants) {
    // Object.assign(this, context)
    this.config = config
    this.constants = constants
    this.baseUrl = `http://${config.address}:${config.port}`
    this.port = config.port

    this.api = supertest(`${this.baseUrl}/api`)
    this.peer = supertest(`${this.baseUrl}/peer`)

    this.normalizer = config.normalizer || 100000000 // Use this to convert DDN amount to normal value
    this.blockTime = config.blockTime || 10000 // Block time in miliseconds
    this.blockTimePlus = config.blockTimePlus || 12000 // Block time + 2 seconds in miliseconds
    this.version = config.version || '0.0.1' // peer version
  }

  randomCapitalUsername () {
    return randomName(
      this.constants.tokenPrefix,
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@$&_.'
    )
  }

  genNormalAccount () {
    const password = randomPassword()
    const keys = DdnCrypto.getKeys(password)
    return {
      address: DdnCrypto.generateAddress(keys.publicKey, this.constants.tokenPrefix),
      publicKey: keys.publicKey,
      password
    }
  }

  randomTid () {
    return this.genNormalAccount().publicKey
  }

  _getHeight (url, cb) {
    request(
      {
        type: 'GET',
        url: `${url}/api/blocks/getHeight`,
        json: true
      },
      (err, res, body) => {
        if (err || res.statusCode !== 200) {
          return cb(err || 'Status code is not 200 (getHeight)')
        } else {
          return cb(null, body.height)
        }
      }
    )
  }

  // Returns current block height
  getHeight (cb) {
    this._getHeight(this.baseUrl, cb)
  }

  onNewBlock (cb) {
    this.getHeight((err, height) => {
      if (err) {
        return cb(err)
      } else {
        this.waitForNewBlock(height, cb)
      }
    })
  }

  // Function used to wait until a new block has been created
  waitForNewBlock (height, cb) {
    const actualHeight = height
    async.doWhilst(
      cb => {
        request(
          {
            type: 'GET',
            url: `${this.baseUrl}/api/blocks/getHeight`,
            json: true
          },
          (err, { statusCode }, body) => {
            if (err || statusCode !== 200) {
              return cb(err || 'Got incorrect status')
            }

            if (bignum.isEqualTo(bignum.plus(height, 1), body.height)) {
              height = body.height
            }
            setTimeout(cb, 1000)
          }
        )
      },
      () => actualHeight === height,
      err => {
        if (err) {
          cb(err)
        } else {
          cb(null, height)
        }
      }
    )
  }

  // Adds peers to local node
  addPeers (numOfPeers, cb) {
    const operatingSystems = ['win32', 'win64', 'ubuntu', 'debian', 'centos']
    const ports = [4000, 5000, 7000, 8000]

    let os
    let version
    let port

    let i = 0
    async.whilst(
      () => i < numOfPeers,
      next => {
        os = operatingSystems[randomizeSelection(operatingSystems.length)]
        version = '1.0.0'
        port = ports[randomizeSelection(ports.length)]

        request(
          {
            type: 'GET',
            url: `${this.baseUrl}/peer/height`,
            json: true,
            headers: {
              version: version,
              port: port,
              nethash: this.constants.nethash,
              os: os
            }
          },
          (err, { statusCode }) => {
            if (err || statusCode !== 200) {
              return next(err || 'Status code is not 200 (getHeight)')
            } else {
              i++
              next()
            }
          }
        )
      },
      err => cb(err)
    )
  }

  submitTransaction (trs, cb) {
    this.peer
      .post('/transactions')
      .set('Accept', 'application/json')
      .set('version', this.version)
      .set('nethash', this.constants.nethash)
      .set('port', this.port)
      .send({
        transaction: trs
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end(cb)
  }

  apiGet (path, cb) {
    this.api.get(path).expect('Content-Type', /json/).expect(200).end(cb)
  }

  giveMoney (address, amount, cb) {
    this.api
      .put('/transactions')
      .set('Accept', 'application/json')
      .send({
        secret: Gaccount.password,
        amount,
        recipientId: address
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end(cb)
  }

  async giveMoneyAndWaitAsync (addresses, amount) {
    await bluebird.map(addresses, async address => {
      const res = await PIFY(this.giveMoney.bind(this))(address, amount || randomCoin())
      expect(res.body).to.have.property('success').to.be.true
    })
    await PIFY(this.onNewBlock.bind(this))()
  }

  sleep (n, cb) {
    setTimeout(cb, n * 1000)
  }

  openAccount (params, cb) {
    this.api
      .post('/accounts/open')
      .set('Accept', 'application/json')
      .send(params)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(cb)
  }

  beginEpochTime () {
    return this.constants.net.beginDate
  }

  getRealTime (epochTime) {
    if (epochTime === undefined) {
      epochTime = this.getTime()
    }
    const d = this.beginEpochTime()
    const t = Math.floor(d.getTime() / 1000) * 1000
    return t + epochTime * 1000
  }

  submitTransactionAsync = PIFY(this.submitTransaction, this)
  onNewBlockAsync = PIFY(this.onNewBlock, this)
  apiGetAsync = PIFY(this.apiGet, this)
  apiGetAsyncE = EIFY(this.apiGet, this)
  giveMoneyAsync = PIFY(this.giveMoney, this)
  sleepAsync = PIFY(this.sleep, this)
  openAccountAsync = PIFY(this.openAccount, this)
}

export * from './random-utils'
export * from './account-utils'
export * from 'chai'

export default {
  // to delete
  chai,
  supertest,
  expect,

  randomCoin,
  Gaccount,
  Daccount,
  Eaccount,

  // wxm TODO 此处使用新的类型
  //   TxTypes: TxTypes,
  AssetTypes: assetTypes,

  // wxm TODO 此处应该使用对应npm包提供的对象
  DappType,
  DappCategory,

  randomProperty,
  randomDelegateName,
  randomPassword,
  randomAccount,
  randomTxAccount,
  randomUsername,
  randomIssuerName,
  randomNumber,

  PIFY,
  EIFY,

  // DAO
  randomOrgId,
  randomIpId
}
