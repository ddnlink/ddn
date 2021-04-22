/*---------------------------------------------------------------------------------------------
 *  Created by Imfly on Sun Dec 29 2019 15:57:56
 *
 *  Copyright (c) 2019 DDN FOUNDATION. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

module.exports = {
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

  /**
   * About Api
   */
  api: {
    access: {
      whiteList: []
    }
  },
  peers: {
    list: [],
    blackList: [],
    options: {
      timeout: 4000
    }
  },
  forging: {
    secret: [
      'board bless spy vague knee extend chair impact unique cycle three soup',
      'index half curve expose front inquiry weapon hurt utility gas action float',
      'title cabin grain buddy sorry shuffle office crater measure version anchor piece',
      'oak olympic habit soda elite skill carpet purse squeeze mouse salad admit',
      'pilot sun age machine topple wave essence night black black vehicle denial',
      'develop laptop chuckle extend course umbrella divorce tomorrow unaware noise cradle kiss',
      'upon poem cat soldier sort humor used harbor prison pass wait cousin',
      'local pelican kiss safe question inject more hat outdoor creek gun enemy',
      'evil submit wood alley crop thought version pitch mother jungle cage alien',
      'ritual leader regular end champion fatigue shoot stomach color royal alter ill',
      'dutch end midnight hen leave rude night replace present check duck cupboard',
      'dolphin enrich violin young favorite proof obey grab position lens elbow ticket',
      'shiver source solve traffic poverty bind much drama common final fold dune',
      'shell judge avoid someone bind message comfort electric hard sadness curious allow',
      'double wrap foot setup scrub luggage tape column cloth picnic lecture good',
      'confirm wait spider quit opinion print ill cushion net weather finish repeat',
      'monitor door team usage void depart useful frame shaft must neither capable',
      'plate stock sudden scrap finish lemon fatigue leaf yellow prosper pony near',
      'work bar farm sustain ozone hamster warfare behave flavor symptom cable future',
      'foot all enrich fresh soul lottery drive own vote web fan scrub',
      'damage reason artist castle damage exclude list walnut icon twice later coin',
      'hood grid juice innocent arrange tool option chapter gorilla vocal nerve boil',
      'trip wrestle trade oyster timber hybrid goddess myself light you defy enjoy',
      'arena session pumpkin inspire planet assist brand topic kid glove discover ceiling',
      'embark razor relax engage deer unfold snow tail trade simple ranch hover',
      'artefact snake buddy gun merge leg elbow door cotton now put inspire',
      'symptom coconut bounce enrich bike scene divorce input since ivory oblige top',
      'worry garlic detail truth weather sure skin kidney photo large issue raven',
      'donate agree crop spawn join social often between garden shift will theme',
      'pistol mention keen bean butter glass reunion grow umbrella damage napkin hour',
      'guide liquid wild torch approve wink venue wealth during weird loyal industry',
      'glory fee season sustain trick hold cat seed nose destroy miss exhaust',
      'coin when equip indicate arctic mistake wreck property priority stuff feed birth',
      'boring canyon random frequent fog chief dignity best mango thumb velvet never',
      'vintage wine arch require motor amount neither scan skin coin ginger bottom',
      'animal sudden moon soccer tide alcohol air vessel connect put invite field',
      'oval roof pioneer prize hour capable recipe trend index uncover cabbage forest',
      'pioneer attitude parent moon decrease grab garment twice dolphin man merge fashion',
      'eager panel music letter obtain mad guide chunk scan reject hope special',
      'father mesh this beauty dragon believe globe action mouse job squeeze sentence',
      'rally simple work excite fold account sunny siren parent coil enact zero',
      'depth witness tired truck motion spawn iron decide enjoy clump industry swing',
      'net grid scheme resource faith shaft cactus medal elbow task vintage pyramid',
      'laptop beach mad walnut easy senior flush choose buddy reduce popular arena',
      'one village neglect cover frame loop affair energy carpet deliver tonight road',
      'bread nephew enrich priority settle opinion taste fence include canyon horror distance',
      'crane impact cheap demand noodle smile possible smooth famous coconut aware caution',
      'grunt sketch spread warfare divert lawn pattern live master artwork mammal erosion',
      'solid supply put spin top begin jewel tribe kidney swim walk firm',
      'proof flight slot human stick spring wheat abandon large nut ivory rebel',
      'else cram rate flip secret cost pepper mail asthma laundry loyal spirit',
      'volume taxi fuel season help lock spare swift stone engine artwork certain',
      'sing legend heart regret convince stage rail siren estate fox castle index',
      'choose choose chunk bulb educate lesson better concert envelope blouse cruel garbage',
      'define glance move dress fancy horn era giggle health village glass faint',
      'afford spin cliff planet chronic mouse toe address brush transfer very derive',
      'group thing runway thumb bleak finish board ridge arctic pudding stumble setup',
      'receive skate fall royal price virtual pilot shoot burger banner soft coral',
      'rebel tobacco quality kangaroo satoshi giant horse craft drift peanut attract manage',
      'person various guilt inherit glad future poet energy captain proof inquiry portion',
      'nominee invest neutral stay couple jeans derive galaxy focus life section diary',
      'behave cargo acoustic purchase roast arena peasant stomach news canoe absorb inmate',
      'evoke ancient vote hair review budget siren now tray art chef coconut',
      'split neck urban shy day swap often inspire now pig cruel holiday',
      'supply sentence coast snake path lucky stone copy tribe agree issue ocean',
      'library immune dizzy wide attack useless lava sun scrap unfair agent space',
      'puzzle banana moral mad pipe random remain father rude ball tent road',
      'orchard spare once quote venture hazard order fresh monster void lemon humble',
      'spoil lend cry surge labor hair upgrade rather march draft coast pulp',
      'polar cube aware shadow virus camp height absent toilet ceiling disease goddess',
      'aerobic impose human amazing coin moon develop output palm bird draft place',
      'door license present total solve must joy demand wise afford game narrow',
      'smoke volume quality blur expand cool blush subject faculty only canvas charge',
      'swing smoke grief universe stick duck carbon pride trash excess license gate',
      'token acoustic observe project attract off nation strong update become connect aunt',
      'foster click script ginger dilemma split humor resource region state rifle yellow',
      'artist master physical awkward ride rare divorce access dance rocket exist march',
      'water roast traffic tilt illegal space usage announce erase august surround noise',
      'spatial venture mountain surprise doll embrace method material property point daring echo',
      'buyer attend visit decade dinner dune stage gather such struggle library animal',
      'vacant pull sustain nasty cruel inch toilet version tourist oblige weapon repeat',
      'divert hammer analyst faculty scout athlete hint deliver claim noodle assume monitor',
      'behind unhappy click grain put cute basic ankle main author strategy negative',
      'improve bicycle token rifle wedding reason east athlete citizen sketch expose flip',
      'brave limb pulse oak fragile feed thrive crystal analyst model opera giggle',
      'fetch glad chronic thrive coach loud recycle brick canal puppy faith tube',
      'shell cheap olympic silent below milk busy skirt nerve grape holiday write',
      'warrior audit address veteran blossom twelve brave wait usage tiger dumb early',
      'coral uncover belt pyramid animal glove strategy legal target two cable only',
      'stick depth poverty front change annual prefer rescue topic pig clarify advance',
      'avoid output pitch stone scan critic zero clap mask icon notable saddle',
      'fruit bachelor rule chaos border sibling crowd stuff parent drip good finger',
      'simple spring fame cover fatal pipe vivid glad view output make admit',
      'uphold oak tool come delay document wise laundry ensure coil scale token',
      'modify ocean taxi oppose impose clown anger blind fork robust loop shadow',
      'twice hope arrange beauty family cloth defy adult balance view size blame',
      'rabbit knife sight recall elite awake brain owner length frequent session skirt',
      'rough critic company blast come hockey safe switch pepper video cost country',
      'magnet outer dove captain wait spray bullet teach guide intact manage crane',
      'punch increase rebuild round layer vacuum trend arrow jeans utility vehicle kingdom',
      'move grow forward session demise shuffle swift ramp child scheme pulp expire'
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
  database: {
    database: 'ddn',
    username: 'root',
    password: 'wawjr1314', // Please use process.env.DBPASSWORD

    options: {
      // the sql dialect of the database
      // currently supported: 'mysql', 'sqlite', 'postgres', 'mssql'
      dialect: 'mysql',

      // custom host; default: localhost
      host: '127.0.0.1',

      // custom port; default: dialect default
      // port: 12345,

      pool: {
        max: 10,
        min: 1,
        idle: 10000
      }

      // SQLite only

      // Sequelize will warn you if you're using the default aliases and not limiting them
      // https://sequelize.org/master/manual/querying.html#operators-aliases
    }
  },
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
  assets: ['@ddn/asset-evidence', '@ddn/asset-dapp']
}
