/*---------------------------------------------------------------------------------------------
 *  Created by Imfly on Sun Dec 29 2019 15:57:56
 *
 *  Copyright (c) 2019 DDN FOUNDATION. All rights reserved.
 *  Licensed under the AGPL 3.0 License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

module.exports = {
  /**
   * About Peer
   */
  port: 8001,
  p2pPort: 9001,
  address: '0.0.0.0',
  publicIp: '127.0.0.1',
  logLevel: 'debug',
  net: 'mainnet',
  nethash: 'm66gcvle',
  payloadLimitSize: '8mb',
  clientDriftSeconds: 5,
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
            { ip: '127.0.0.1', port: '9002', httpPort: '8002' }, { ip: '127.0.0.1', port: '9003', httpPort: '8003' }, { ip: '127.0.0.1', port: '9004', httpPort: '8004' }, { ip: '127.0.0.1', port: '9005', httpPort: '8005' }
        ],
    blackList: [],
    options: {
      timeout: 4000
    }
  },
  forging: {
    secret: [
      "solar spoil climb timber core lumber ankle evoke limit tilt panda leg",
      "park trim obscure fan shallow wrestle noble grace resemble theory bacon length",
      "level fresh harsh coin cash merry wire device pudding pistol vast yard",
      "soap secret oven curious fly fire strike cycle team shove dizzy innocent",
      "can wrestle jealous stick thought critic soup pet cover boring street final",
      "aerobic february crumble drill choose act useless shoulder enrich cart reduce arena",
      "mountain such embrace assume visa top hobby slot pluck echo ocean punch",
      "brief silver name wasp harvest nurse glow jewel subject chef brave paddle",
      "quit legal sister apology palace afford address brush tiger cluster gasp buffalo",
      "story rack mass auto genuine pepper brave allow sibling staff screen also",
      "assault wolf pyramid replace bike list echo document bridge dial notice nation",
      "brand donate old dream fabric switch foam scissors now frog permit exclude",
      "drama wedding earn foil sister box crop defy demise cruise verb boost",
      "report east episode lumber top spot raccoon pyramid virtual speak monster pet",
      "glare swift sound bright option west drive alarm ignore cheese baby walnut",
      "flag mom first grid weapon auto apart strike actor unique produce south",
      "biology poet permit drop permit control lemon bitter defense baby memory panel",
      "consider ramp tube blur unaware advance effort prison aunt region adult drop",
      "body echo cigar hole real farm flavor find smile list erosion awkward",
      "normal sock drive toward dirt more egg fog hip hobby anxiety like",
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
    masterpassword: 'xS5XaSoHsTEL',
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
