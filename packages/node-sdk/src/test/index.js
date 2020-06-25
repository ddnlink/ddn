/* ---------------------------------------------------------------------------------------------
 *  Created by DDN Team on Thu Mar 15 2017 9:37:56
 *
 *  Copyright (c) 2019 DDN Foundation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

import path from 'path'

import chai, { expect } from 'chai'
import supertest from 'supertest'
import async from 'async'
import request from 'request'
import bluebird from 'bluebird'
import DdnUtils from '@ddn/utils'
import DdnCrypto from '@ddn/crypto'
import { getConfigFile, requireFile } from '@ddn/core/lib/getUserConfig'
import ddn from '../../lib'

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

import Constants from '../constants'

const { bignum } = DdnUtils

// Node configuration
const baseDir = path.resolve(process.cwd(), './examples/fun-tests')
const configFile = getConfigFile(baseDir)
const config = requireFile(configFile)

const baseUrl = `http://${config.address}:${config.port}`
const api = supertest(`${baseUrl}/api`)
const peer = supertest(`${baseUrl}/peer`)

const normalizer = 100000000 // Use this to convert DDN amount to normal value
const blockTime = 10000 // Block time in miliseconds
const blockTimePlus = 12000 // Block time + 2 seconds in miliseconds
const version = '2.0.0' // peer version

// 简化常量调用
const constants = Constants
constants.net = Constants[config.net]

// Holds Fee amounts for different transaction types
const Fees = {
  voteFee: '10000000', // bignum update
  transactionFee: '10000000',
  secondPasswordFee: '500000000',
  delegateRegistrationFee: '10000000000',
  multisignatureRegistrationFee: '500000000',
  dappAddFee: '10000000000'
}

// Calculates the expected fee from a transaction
function expectedFee (amount) {
  return Fees.transactionFee
}

function randomCapitalUsername () {
  return randomName(constants.tokenPrefix, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@$&_.')
}

function genNormalAccount () {
  const password = randomPassword()
  const keys = DdnCrypto.getKeys(password)
  return {
    address: DdnCrypto.generateAddress(keys.publicKey, constants.tokenPrefix),
    publicKey: keys.publicKey,
    password
  }
}

function randomTid () {
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
function getHeight (cb) {
  _getHeight(baseUrl, cb)
}

function onNewBlock (cb) {
  getHeight((err, height) => {
    if (err) {
      return cb(err)
    } else {
      waitForNewBlock(height, cb)
    }
  })
}

// Function used to wait until a new block has been created
function waitForNewBlock (height, cb) {
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
function addPeers (numOfPeers, cb) {
  const operatingSystems = ['win32', 'win64', 'ubuntu', 'debian', 'centos']
  const ports = [4000, 5000, 7000, 8000]

  let os
  let version
  let port

  let i = 0
  async.whilst(() => i < numOfPeers, next => {
    os = operatingSystems[randomizeSelection(operatingSystems.length)]
    version = '1.0.4' // development ?
    port = ports[randomizeSelection(ports.length)]

    request({
      type: 'GET',
      url: `${baseUrl}/peer/height`,
      json: true,
      headers: {
        version: version,
        port: port,
        nethash: config.nethash,
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

function submitTransaction (trs, cb) {
  peer.post('/transactions')
    .set('Accept', 'application/json')
    .set('version', version)
    .set('nethash', config.nethash)
    .set('port', config.port)
    .send({
      transaction: trs
    })
    .expect('Content-Type', /json/)
    .expect(200)
    .end(cb)
}

function apiGet (path, cb) {
  api.get(path)
    .expect('Content-Type', /json/)
    .expect(200)
    .end(cb)
}

function giveMoney (address, amount, cb) {
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

async function giveMoneyAndWaitAsync (addresses, amount) {
  await bluebird.map(addresses, async (address) => {
    const res = await PIFY(giveMoney)(address, amount || randomCoin())
    expect(res.body).to.have.property('success').to.be.true
  })
  await PIFY(onNewBlock)()
}

function sleep (n, cb) {
  setTimeout(cb, n * 1000)
}

function openAccount (params, cb) {
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

function beginEpochTime () {
  return constants.net.beginDate
}

function getRealTime (epochTime) {
  if (epochTime === undefined) {
    epochTime = this.getTime()
  }
  const d = beginEpochTime()
  const t = Math.floor(d.getTime() / 1000) * 1000
  return t + epochTime * 1000
}

// 初始化
ddn.init()

export default {
  api,
  chai,
  peer,
  ddn,
  supertest,
  expect,
  version,
  randomCoin,
  Gaccount,
  Daccount,
  Eaccount,

  // wxm TODO 此处使用新的类型
  //   TxTypes: TxTypes,
  AssetTypes: DdnUtils.assetTypes,

  // wxm TODO 此处应该使用对应npm包提供的对象
  DappType,
  DappCategory,

  Fees,
  normalizer,
  blockTime,
  blockTimePlus,
  randomProperty,
  randomDelegateName,
  randomPassword,
  randomAccount,
  randomTxAccount,
  randomUsername,
  randomIssuerName,
  randomNumber,
  randomCapitalUsername,
  expectedFee,
  addPeers,
  config,
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
