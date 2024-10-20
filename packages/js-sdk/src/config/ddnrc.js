/*---------------------------------------------------------------------------------------------
 *  Created by Imfly on Sun Dec 29 2019 15:57:56
 *
 *  Copyright (c) 2019 DDN FOUNDATION. All rights reserved.
 *  Licensed under the AGPL 3.0 License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export default {
  /**
   * About Peer
   */
  port: 8001,
  address: '0.0.0.0',
  publicIp: '127.0.0.1',
  logLevel: 'debug',
  net: 'testnet',
  nethash: '0ab796cd',
  payloadLimitSize: '8mb',
  clientDriftSeconds: 5,
  p2pPort: 9001,
  /**
   * About Api
   */
  peers: {
    list: [
      { ip: '127.0.0.1', port: '9002' },
      { ip: '127.0.0.1', port: '9003' },
    ],
    blackList: [],
    options: {
      timeout: 4000
    }
  },

  dapp: {
    masterpassword: 'xS5XaSoHsTEL',
    params: {}
  },

  /**
   * 扩展资产插件，对于区块链而言就是资产包，所以使用 assets
   * 前端无法访问文件，所以直接使用 json 格式
   */
  assets: {
    '@ddn/asset-evidence': {
      transactions: [
        {
          name: 'Evidence',
          type: 20
        }
      ]
    },
    '@ddn/asset-aob': {
      transactions: [
        {
          name: 'AobIssuer',
          type: 60
        },
        {
          name: 'AobAsset',
          type: 61
        },
        {
          name: 'AobFlags',
          type: 62
        },
        {
          name: 'AobAcl',
          type: 63
        },
        {
          name: 'AobIssue',
          type: 64
        },
        {
          name: 'AobTransfer',
          type: 65
        }
      ]
    },
    '@ddn/asset-dapp': {
      transactions: [
        {
          name: 'Dapp',
          type: 5 // 11
        },
        {
          name: 'DappIn',
          type: 6 // 12
        },
        {
          name: 'DappOut',
          type: 7 //  13
        }
      ]
    },
    '@ddn/asset-dao': {
      transactions: [
        {
          name: 'DaoOrg',
          type: 40
        },
        {
          name: 'DaoExchange',
          type: 41
        },
        {
          name: 'DaoContribution',
          type: 42
        },
        {
          name: 'DaoConfirmation',
          type: 43
        }
      ]
    }
  },
  crypto: '@ddn/crypto-nacl' // 绿化钠 @ddn/crypto-nacl ，国密 @ddn/crypto-sm
}
