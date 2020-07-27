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
import DdnCrypto from '@ddn/crypto'

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

import {
  Daccount,
  Eaccount,
  Gaccount
} from './accout-utils'

// TODO 包的整理规划需要进一步明确原则，根据通用性确定是否写成npm包
import { DappCategory, DappType } from '@ddn/asset-dapp'

const assetTypes = DdnUtils.assetTypes
const bignum = DdnUtils.bignum

// Node configuration
let constants
let version
let normalizer
let blockTime
let blockTimePlus
let api
let peer
let baseUrl
let port

function init (config, userConstants) {
  baseUrl = `http://${config.address}:${config.port}`

  api = supertest(`${baseUrl}/api`)
  peer = supertest(`${baseUrl}/peer`)

  normalizer = config.normalizer || 100000000 // Use this to convert DDN amount to normal value
  blockTime = config.blockTime || 10000 // Block time in miliseconds
  blockTimePlus = config.blockTimePlus || 12000 // Block time + 2 seconds in miliseconds
  version = config.version || '0.0.1' // peer version

  // 简化常量调用
  constants = userConstants
}

export function randomCapitalUsername () {
  return randomName(constants.tokenPrefix, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@$&_.')
}

export function genNormalAccount () {
  const password = randomPassword()
  const keys = DdnCrypto.getKeys(password)
  return {
    address: DdnCrypto.generateAddress(keys.publicKey, constants.tokenPrefix),
    publicKey: keys.publicKey,
    password
  }
}

export function randomTid () {
  return genNormalAccount().publicKey
}

function _getHeight (url, cb) {
  request({
    type: 'GET',
    url: `${url}/api/blocks/getHeight`,
    json: true
  }, (err, res, body) => {
    if (err || res.statusCode !== 200) {
      return cb(err || 'Status code is not 200 (getHeight)')
    } else {
      return cb(null, body.height)
    }
  })
}

// Returns current block height
export function getHeight (cb) {
  _getHeight(baseUrl, cb)
}

export function onNewBlock (cb) {
  getHeight((err, height) => {
    if (err) {
      return cb(err)
    } else {
      waitForNewBlock(height, cb)
    }
  })
}

// Function used to wait until a new block has been created
export function waitForNewBlock (height, cb) {
  const actualHeight = height
  async.doWhilst(
    cb => {
      request({
        type: 'GET',
        url: `${baseUrl}/api/blocks/getHeight`,
        json: true
      }, (err, { statusCode }, body) => {
        if (err || statusCode !== 200) {
          return cb(err || 'Got incorrect status')
        }

        // bignum update if (height + 1 === body.height) {
        if (bignum.isEqualTo(bignum.plus(height, 1), body.height)) {
          height = body.height
        }

        setTimeout(cb, 1000)
      })
    },
    () => actualHeight === height,
    err => {
      if (err) {
        cb(err)
        // return setImmediate(cb, err);
      } else {
        cb(null, height)
        // return setImmediate(cb, null, height);
      }
    }
  )
}

// Adds peers to local node
export function addPeers (numOfPeers, cb) {
  const operatingSystems = ['win32', 'win64', 'ubuntu', 'debian', 'centos']
  const ports = [4000, 5000, 7000, 8000]

  let os
  let version
  let port

  let i = 0
  async.whilst(() => i < numOfPeers, next => {
    os = operatingSystems[randomizeSelection(operatingSystems.length)]
    version = '1.0.0'
    port = ports[randomizeSelection(ports.length)]

    request({
      type: 'GET',
      url: `${baseUrl}/peer/height`,
      json: true,
      headers: {
        version: version,
        port: port,
        nethash: constants.nethash,
        os: os
      }
    }, (err, { statusCode }) => {
      if (err || statusCode !== 200) {
        return next(err || 'Status code is not 200 (getHeight)')
      } else {
        i++
        next()
      }
    })
  }, err => cb(err))
}

export function submitTransaction (trs, cb) {
  peer.post('/transactions')
    .set('Accept', 'application/json')
    .set('version', version)
    .set('nethash', constants.nethash)
    .set('port', port)
    .send({
      transaction: trs
    })
    .expect('Content-Type', /json/)
    .expect(200)
    .end(cb)
}

export function apiGet (path, cb) {
  api.get(path)
    .expect('Content-Type', /json/)
    .expect(200)
    .end(cb)
}

export function giveMoney (address, amount, cb) {
  api.put('/transactions')
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

export async function giveMoneyAndWaitAsync (addresses, amount) {
  await bluebird.map(addresses, async (address) => {
    const res = await PIFY(giveMoney)(address, amount || randomCoin())
    expect(res.body).to.have.property('success').to.be.true
  })
  await PIFY(onNewBlock)()
}

export function sleep (n, cb) {
  setTimeout(cb, n * 1000)
}

export function openAccount (params, cb) {
  api.post('/accounts/open')
    .set('Accept', 'application/json')
    .send(params)
    .expect('Content-Type', /json/)
    .expect(200)
    .end(cb)
}

function PIFY (fn, receiver) {
  return (...args) => new Promise((resolve, reject) => {
    fn.apply(receiver, [...args, (err, result) => err ? reject(err) : resolve(result)])
  })
}

function EIFY (fn, receiver) {
  return (...args) => new Promise((resolve, reject) => {
    fn.apply(receiver, [...args, (err, result) => resolve([err, result])])
  })
}

export function beginEpochTime () {
  return constants.net.beginDate
}

export function getRealTime (epochTime) {
  if (epochTime === undefined) {
    epochTime = this.getTime()
  }
  const d = beginEpochTime()
  const t = Math.floor(d.getTime() / 1000) * 1000
  return t + epochTime * 1000
}

export * from './random-utils'
export * from './accout-utils'
export * from 'chai'

export default {
  init,

  // to delete
  chai,
  supertest,
  expect,

  api,
  peer,
  version,
  normalizer,
  blockTime,
  blockTimePlus,

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
  randomCapitalUsername,
  addPeers,
  waitForNewBlock,
  _getheight: _getHeight,
  getHeight,
  onNewBlock,
  submitTransaction,
  apiGet,
  genNormalAccount,
  openAccount,
  PIFY,
  EIFY,

  submitTransactionAsyncE: EIFY(submitTransaction),
  onNewBlockAsyncE: EIFY(onNewBlock),
  apiGetAsyncE: EIFY(apiGet),
  giveMoneyAsyncE: EIFY(giveMoney),

  submitTransactionAsync: PIFY(submitTransaction),
  onNewBlockAsync: PIFY(onNewBlock),
  apiGetAsync: PIFY(apiGet),
  giveMoneyAsync: PIFY(giveMoney),
  giveMoneyAndWaitAsync,
  sleepAsync: PIFY(sleep),
  openAccountAsync: PIFY(openAccount),
  randomTid,

  // DAO
  randomOrgId,
  randomIpId,
  constants,

  getRealTime
}
