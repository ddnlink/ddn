/*---------------------------------------------------------------------------------------------
 *  Created by DDN Team on Thu Mar 15 2017 9:37:56
 *
 *  Copyright (c) 2019 DDN Foundation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import path from 'path';

import _ from 'lodash';
import chai, {expect}  from 'chai';
import supertest from 'supertest';
import async from 'async';
import request from 'request';
import bluebird from 'bluebird';

import {getConfigFile, requireFile} from '@ddn/core/lib/getUserConfig';
import DdnUtils from '@ddn/utils';
import DdnCrepto from '@ddn/utils';
import ddn from '../';

// TODO 包的整理规划需要进一步明确原则，根据通用性确定是否写成npm包
import {DappCategory, DappType} from '@ddn/asset-dapp';

import Constants from './constants';

const { bignum } = DdnUtils;

// Node configuration
const baseDir = path.resolve(process.cwd(), './examples/fun-tests');
const configFile = getConfigFile(baseDir);
const config = requireFile(configFile);

const baseUrl = `http://${config.address}:${config.port}`;
const api = supertest(`${baseUrl}/api`);
const peer = supertest(`${baseUrl}/peer`);

const normalizer = 100000000; // Use this to convert DDN amount to normal value
const blockTime = 10000; // Block time in miliseconds
const blockTimePlus = 12000; // Block time + 2 seconds in miliseconds
const version = '2.0.0'; // peer version

// 简化常量调用
const constants = Constants;
constants.net = Constants[config.net];

// Holds Fee amounts for different transaction types
const Fees = {
  voteFee: "10000000",  //bignum update
  transactionFee: "10000000",
  secondPasswordFee: "500000000",
  delegateRegistrationFee: "10000000000",
  multisignatureRegistrationFee: "500000000",
  dappAddFee: "10000000000"
};

const guestbookDapp = {
  icon: 'http://ebookchain.org/static/media/logo.5e78d8c2.png',
  link: 'http://www.ebookchain.org/dapp-demo.zip'
};

const Daccount = { // -wly 修改数据库字段后
  'address': 'DJS57PDiq2srYdL5eqzUt7oAZ4WvEkVT9q',
  'publicKey': 'ae19cd4f38454a22cb976383f092211b3735dc54d7002c1c084c48a187834e85',
  'password': 'toward weapon judge twice two wine salmon primary attract public stool crawl',
  'secondPassword': '',
  'balance': 0,
  'delegateName': 'TestDelegate',
};

const Eaccount = { // wly 修改数据库名称后重新生成
  'address': 'DLbsdFXJNVa68SCAJxtGMaGdfBWkPALZzJ',
  'publicKey': '0b5cfb77f401c818f7ebf02a0e88d52a28d3e4e24643e8a080c0c20ac45d0b9c',
  'password': 'elite sunset cake shaft human cradle remember select flame panther tongue ancient',
};

const Gaccount = {
  "address": "DCE3q83WTqk58Y3hU9GDStn7MmqWU9xHbK",
  "password": "enter boring shaft rent essence foil trick vibrant fabric quote indoor output",
  'publicKey': '2e6d978c5e6f1fbfc5a27abd964d9b6adc352daa81e31d9098a4f5ee3d7f885e',
  'balance': 10000000000000000
};

// Random DDN Amount
//bignum update var RANDOM_COIN = Math.floor(Math.random() * (100000 * 100000000)) + 1;
const RANDOM_COIN = bignum.plus(bignum.floor(bignum.multiply(Math.random(), 100000, 100000000)), 1).toString();

// Used to create random delegates names
function randomDelegateName() {
  return randomName(20, '', 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789');
}

// Randomize a property from within an object
function randomProperty(obj, needKey) {
  const keys = Object.keys(obj);

  if (!needKey) {
    return obj[keys[keys.length * Math.random() << 0]];
  } else {
    return keys[keys.length * Math.random() << 0];
  }
}

// Randomizes DDN amount
function randomCoin() {
  return `${Math.floor(Math.random() * (10000 * 100000000)) + (1000 * 100000000)}`;
}

// Dao
function randomOrgId() {
  const name = randomName(15, '', 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789');
  return `DAO1${name}M`; // >= 5 bit
}

function randomIpId() {
  const name = randomName(15, '', 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789');
  const date = new Date;
  const time = `${date.getFullYear()}${date.getUTCMonth()}${date.getUTCDate()}`;
  return `IPID${time}${name}A`; // >= 5 bit
}

function _getHeight(url, cb) {
  request({
    type: 'GET',
    url: `${url}/api/blocks/getHeight`,
    json: true
  }, (err, {statusCode}, body) => {
    if (err || statusCode != 200) {
      console.log("body===", body);

      return cb(err || 'Status code is not 200 (getHeight)');
    } else {
      return cb(null, body.height);
    }
  })
}

// Returns current block height
function getHeight(cb) {
  _getHeight(baseUrl, cb)
}

function onNewBlock(cb) {
  getHeight((err, height) => {
    if (err) {
      return cb(err);
    } else {
      waitForNewBlock(height, cb);
    }
  });
}

// Function used to wait until a new block has been created
function waitForNewBlock(height, cb) {
  const actualHeight = height;
  async.doWhilst(
    cb => {
      request({
        type: 'GET',
        url: `${baseUrl}/api/blocks/getHeight`,
        json: true
      }, (err, {statusCode}, body) => {
        if (err || statusCode != 200) {
          return cb(err || 'Got incorrect status');
        }

        //bignum update if (height + 1 == body.height) {
        if (bignum.isEqualTo(bignum.plus(height, 1), body.height)) {
          height = body.height;
        }

        setTimeout(cb, 1000);
      });
    },
    () => actualHeight == height,
    err => {
      if (err) {
          cb(err);
        // return setImmediate(cb, err);
      } else {
          cb(null, height);
        // return setImmediate(cb, null, height);
      }
    }
  )
}

// Adds peers to local node
function addPeers(numOfPeers, cb) {
  const operatingSystems = ['win32', 'win64', 'ubuntu', 'debian', 'centos'];
  const ports = [4000, 5000, 7000, 8000];

  let os;
  let version;
  let port;

  let i = 0;
  async.whilst(() => i < numOfPeers, next => {
    os = operatingSystems[randomizeSelection(operatingSystems.length)];
    version = '1.0.4'; // development ?
    port = ports[randomizeSelection(ports.length)];

    request({
      type: 'GET',
      url: `${baseUrl}/peer/height`,
      json: true,
      headers: {
        'version': version,
        'port': port,
        'nethash': config.nethash,
        'os': os
      }
    }, (err, {statusCode}, body) => {
      if (err || statusCode != 200) {
        return next(err || 'Status code is not 200 (getHeight)');
      } else {
        i++;
        next();
      }
    })
  }, err => cb(err));
}

// Used to randomize selecting from within an array. Requires array length
function randomizeSelection(length) {
  return Math.floor(Math.random() * length);
}

// Returns a random number between min (inclusive) and max (exclusive)
function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

// Calculates the expected fee from a transaction
function expectedFee(amount) {
//bignum update   return parseInt(Fees.transactionFee);
    return Fees.transactionFee;
}

// Used to create random usernames
function randomUsername() {
  return randomName('', 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@$&_.');
}

function randomIssuerName() {
  return randomName('', 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz');
}

function randomCapitalUsername() {
  return randomName(constants.tokenPrefix, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@$&_.');
}

function randomName(...args) {
  // Convert arguments to Array
  const array = Array.prototype.slice.apply(args);

  let max = 16;
  if(array.length > 2) {
    max = array.shift();
  }

  let name = array[0];
  const random = array[1];

  let size = randomNumber(1, max);
  if (name.length > 0) {
    size = size - 1
  }

  for (let i = 0; i < size; i++){
    name += random.charAt(Math.floor(Math.random() * random.length));
  }

  return name;
}

// Used to create random basic accounts
function randomAccount() {
  const account = {
    'address': '',
    'publicKey': '',
    'password': '',
    'secondPassword': '',
    'username': '',
    'balance': 0
  };

  account.password = randomPassword();
  account.secondPassword = randomPassword();
  account.username = randomDelegateName();

  return account;
}

function genNormalAccount() {
  const password = randomPassword();
  const keys = ddn.crypto.getKeys(password);
  return {
    address: DdnCrepto.generateAddress(keys.publicKey, constants.tokenPrefix),
    publicKey: keys.publicKey,
    password
  };
}

function randomTid() {
  return genNormalAccount().publicKey
}

// Used to create random transaction accounts (holds additional info to regular account)
function randomTxAccount() {
  return _.defaults(randomAccount(), {
    sentAmount: '',
    paidFee: '',
    totalPaidFee: '',
    transactions: []
  })
}

// Used to create random passwords
function randomPassword() {
  return Math.random().toString(36).substring(7);
}

function submitTransaction(trs, cb) {
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
    .end(cb);
}

function apiGet(path, cb) {
  api.get(path)
    .expect('Content-Type', /json/)
    .expect(200)
    .end(cb)
}

function giveMoney(address, amount, cb) {
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

async function giveMoneyAndWaitAsync(addresses, amount) {
  await bluebird.map(addresses, async (address) => {
    let res = await PIFY(giveMoney)(address, amount || randomCoin())
    expect(res.body).to.have.property('success').to.be.true
  })
  await PIFY(onNewBlock)()
}

function sleep(n, cb) {
  setTimeout(cb, n * 1000)
}

function openAccount(params, cb) {
  api.post('/accounts/open')
    .set('Accept', 'application/json')
    .send(params)
    .expect('Content-Type', /json/)
    .expect(200)
    .end(cb)
}

function PIFY(fn, receiver) {
  return (...args) => new Promise((resolve, reject) => {
    fn.apply(receiver, [...args, (err, result) => err ? reject(err) : resolve(result)])
  });
}

function EIFY(fn, receiver) {
  return (...args) => new Promise((resolve, reject) => {
    fn.apply(receiver, [...args, (err, result) => resolve([err, result])])
  });
}

function beginEpochTime() {   
  return constants.net.beginDate;
}

function getRealTime(epochTime) {
  if (epochTime === undefined) {
    epochTime = this.getTime()
  }
  const d = beginEpochTime();
  const t = Math.floor(d.getTime() / 1000) * 1000;
  return t + epochTime * 1000;
}

// 初始化
ddn.init();

console.log('constants.net.beginDate= ', constants.net.beginDate);

export default {
  api,
  chai,
  peer,
  ddn,
  supertest,
  expect,
  version,
  RANDOM_COIN,
  Gaccount,
  Daccount,
  Eaccount,

  //wxm TODO 此处使用新的类型
//   TxTypes: TxTypes,
  AssetTypes: DdnUtils.assetTypes,

  //wxm TODO 此处应该使用对应npm包提供的对象
  DappType,
  DappCategory,

  guestbookDapp,
  Fees,
  normalizer,
  blockTime,
  blockTimePlus,
  randomProperty,
  randomDelegateName,
  randomCoin,
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
};
