/* ---------------------------------------------------------------------------------------------
 *  Created by Imfly on Sun Dec 29 2019 15:57:56
 *
 *  Copyright (c) 2019 DDN FOUNDATION. All rights reserved.
 *  Licensed under the AGPL 3.0 License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

module.exports = {
  /**
   * About Peer
   */
  port: 8001,
  address: '0.0.0.0',
  publicIp: '127.0.0.1',
  logLevel: 'debug',
  net: 'mainnet',
  nethash: 'm66gcvle',
  payloadLimitSize: '8mb',
  clientDriftSeconds: 5,
  p2pPort: 9001,
  /**
   * About Api
   */
  api: {
    access: {
      whiteList: []
    }
  },
  peers: {
    list: [
      { ip: '127.0.0.1', port: '9002' },
    ],
    blackList: [],
    options: {
      timeout: 4000
    }
  },
  forging: {
    secret: [
      
    ],
    access: {
      whiteList: ['127.0.0.1']
    }
  },
  loading: {
    verifyOnLoading: false,
    loadPerIteration: 5000
  },
  ssl: {
    enabled: false,
    options: {
      port: 443,
      address: '0.0.0.0',
      key: './ssl/server.key',
      cert: './ssl/server.crt'
    }
  },
  dapp: {
    masterpassword: 'c9052fca5c6c',
    params: {}
  },

  /**
   * Database options
   * https://sequelize.org/master/class/lib/sequelize.js~Sequelize.html#instance-constructor-constructor
   * */
  // database: {
  //   database: 'ddn',
  //   username: 'root',
  //   password: 'wawjr1314', // Please use process.env.DBPASSWORD

  //   options: {
  //     // the sql dialect of the database
  //     // currently supported: 'mysql', 'sqlite', 'postgres', 'mssql'
  //     dialect: 'mysql',

  //     // custom host; default: localhost
  //     host: '127.0.0.1',

  //     // custom port; default: dialect default
  //     // port: 12345,

  //     pool: {
  //       max: 10,
  //       min: 1,
  //       idle: 10000
  //     }

  //     // SQLite only

  //     // Sequelize will warn you if you're using the default aliases and not limiting them
  //     // https://sequelize.org/master/manual/querying.html#operators-aliases
  //   }
  // },
  // database: {
  //   database:  'ddn2',
  //   username:  'postgres',
  //   password: 'wawjr1314', // Please use process.env.DBPASSWORD

  //   options: {
  //     // the sql dialect of the database
  //     // currently supported: 'mysql', 'sqlite', 'postgres', 'mssql'
  //     dialect: 'postgres',

  //     // custom host; default: localhost
  //     host: 'localhost',

  //     // custom port; default: dialect default
  //     // port: 12345,

  //     pool: {
  //       max: 10,
  //       min: 1,
  //       idle: 10000
  //     },

  //     // SQLite only

  //     // Sequelize will warn you if you're using the default aliases and not limiting them
  //     // https://sequelize.org/master/manual/querying.html#operators-aliases
  //   }
  // },

  /**
   * 扩展资产插件，对于区块链而言就是资产包，所以使用 assets
   * assets: [
   *  "@ddn/asset-evidence",
   *  "@ddn/asset-aob"
   * ]
   */
  assets: ['@ddn/asset-evidence', '@ddn/asset-dapp', '@ddn/asset-aob', '@ddn/asset-dao'],
  crypto: '@ddn/crypto-nacl' // 绿化钠 @ddn/crypto-nacl ，国密 @ddn/crypto-sm
}
