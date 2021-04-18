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
      'regular only quantum tape tomorrow lawn midnight flight hawk genius novel frost',
      'feature crowd arctic client section fancy vivid large know inquiry depart alley',
      'want unfair actress cheap rather say poem coast catalog endorse cradle clerk',
      'horror cruel where road shaft tail increase favorite size camera picture sunset',
      'recycle enlist oil scene half adult artefact ordinary series oil hood blast',
      'world ice alpha proof inject taste quick pond sight measure nature man',
      'hero nuclear meat devote treat genre involve spider use exclude churn choice',
      'dial wood party chase era phone nominee nice upgrade bean ranch affair',
      'offer expect work physical better large arrange alpha deposit uniform hold amateur',
      'erupt program repair awkward leopard nice garden dutch exhibit demise educate twice',
      'cherry stool make kitten you arrow dry apart mystery artist scissors blade',
      'century typical cage project wild razor draw stereo debate shaft author damp',
      'space cloud ridge rate jacket execute mix anger gravity motion delay target',
      'shine rifle immune crash double whale illegal modify peace firm silly leader',
      'tortoise modify exhaust goose tissue debate impose staff stock involve panic tired',
      'spoil soccer vessel excess retire patch naive oak field bicycle chest bread',
      'pear island afford okay opera cake radar spider act athlete plastic blind',
      'ritual summer young business shove fee corn stage jar pair believe fruit',
      'gospel omit stuff tuition velvet museum anger domain wire cherry real slogan',
      'setup neutral strategy giggle olive ordinary swift prize spatial menu truck accuse',
      'tongue senior prevent duck couple apart hour escape damp deny crime good',
      'cabin link immune affair poem current pyramid shift gift orphan skirt note',
      'suit tuition birth remind pledge genuine leopard stairs comfort level inside brain',
      'device garden expect chaos bar strategy idle dose comic embody dash across',
      'skin breeze cube kidney nasty guide snap pool uncover local harsh road',
      'barely under hood science mosquito heavy olympic ritual alien ice chronic olympic',
      'smoke join solution inquiry sport present become armor woman impose voyage expose',
      'energy great faith harbor local refuse bitter skate culture pen kingdom shy',
      'fossil phrase kit year hint sound amount visit impulse equal identify fog',
      'humor party toast typical lesson bundle outside rude adapt run average valve',
      'oxygen avoid pottery service patient force law online dentist cloth consider theory',
      'broken energy garlic badge ozone fade cruel coconut photo meadow fat wheel',
      'model churn annual will tooth radio betray notable soccer thank omit helmet',
      'pupil rigid chase churn number tourist kitten foam quote decorate black stomach',
      'palace midnight obscure thank order quality address limb topple subway crater glance',
      'siren chest under craft drip inherit nurse include electric artwork journey athlete',
      'nuclear rhythm worry wisdom shoe fat brass harsh wave embody outside theory',
      'midnight magic stairs modify solar boil review economy unable glass rhythm february',
      'account sport typical ice giggle hand top depart feature report label catalog',
      'fruit soap same rotate doll phrase major resist lyrics rifle floor rice',
      'possible north build village ice half market doctor degree birth exhibit buyer',
      'nerve year flip flower pattern anchor critic pluck human main year match',
      'length bean police oblige steel fatigue answer domain input thing slight siege',
      'absurd actress seed stage trumpet gallery finish urban present buddy cotton regular',
      'object round ready blouse car strong donor paddle adult coin fiscal disease',
      'float tuna exclude sniff mass behave guilt shoe alone fringe task ahead',
      'system buzz fabric plastic call bus make cave senior bulb consider bird',
      'trophy tuition bitter mushroom crazy honey real team ball carpet bar balcony',
      'viable unusual lumber total march cash duck source few apology burden library',
      'liar keen garage toddler palace lottery top flee bachelor pigeon dignity crouch',
      'attack mechanic wrist grief tuition return blur ability inmate secret biology negative',
      'fan fruit end orphan adjust radio strategy foster ripple bundle sting follow',
      'sausage open hover draft view more detail dragon inmate hybrid relief today',
      'occur useful runway install border unable science unfair start perfect gap track',
      'shield soon unique file story pony oblige sense trap purchase payment rocket',
      'hint metal banana leisure tornado mean duty amused couch valve improve finish',
      'rather hunt pause letter bamboo engage aware sketch champion maze curve rough',
      'soul match credit battle when clock soccer trigger robust observe success wear',
      'frog income lizard off bottom combine unit emerge maid apple tray liquid',
      'north cook push capable vintage trial farm benefit phone tuition floor jewel',
      'bench ecology program wink sick plunge lake eager strong soft armed tattoo',
      'govern will drop cattle vicious elevator drip ceiling term rule strong cabbage',
      'such wish isolate advance transfer come legal predict gallery pool deer crowd',
      'minimum foot scout heavy potato dawn hole blood future glide drink among',
      'tourist dumb theme trap pupil pause session avocado float master uniform print',
      'cheese portion original apart lyrics stand rookie bundle craft plunge unfold silly',
      'problem glove wish recall hour force attitude reject pretty hip hockey radar',
      'sword feel wheel merge when female toilet rocket eager save foil bicycle',
      'hazard forward dutch gain tattoo then observe salon renew various popular chat',
      'matter mercy remind club slice monster oven melt math embrace small admit',
      'raven vicious corn oval paper curtain wire embody alone sick rival draft',
      'water trumpet jazz canal coast crazy market crawl evolve lady settle sibling',
      'depend police angry ginger mechanic drama caution game case stable fun expire',
      'length answer motion wear jungle hobby behind patrol mention anger dress else',
      'merit nest mango measure various outer pull mixture become brass repeat sample',
      'typical special novel depend wine people mesh master lion choose predict combine',
      'great rubber chaos invite swamp whale rival general float garlic gasp glare',
      'rule age video misery auto fly gym lift great truck adapt demand',
      'math behave okay tag crawl iron charge easy recycle hope replace until',
      'crystal define genuine execute climb grass jelly ribbon hungry absent dynamic wide',
      'cement stem husband student review screen stock announce lottery sister ahead march',
      'latin apart diesel ticket bar risk number sugar deer smart there shiver',
      'caution retreat genuine napkin conduct woman culture bargain shadow dismiss powder birth',
      'unit trip broccoli again clever duty fiscal shallow oil brass captain input',
      'tuna note hole loop hub raw ankle blanket cover reopen shrimp nephew',
      'mango island roast kangaroo strike once apart dentist analyst push glove abuse',
      'rice health major move sing must just element sudden peace copy exclude',
      'used view festival dance coyote toe radar seed symbol double nut host',
      'relax public strong panda flavor gentle junk toe trumpet clump category correct',
      'warrior lunch flag leader spider flavor sad pigeon journey joy acid broom',
      'fish harsh rally tuna quote plunge put excuse bread august edge wood',
      'rice fringe jelly cement monster fox tube water crash glory slogan nurse',
      'voice dutch round profit jelly time puppy question clip under accident obscure',
      'duty ball tool clump prison draft catch flame agent mother edit obscure',
      'index draft mercy art swap flock frost flavor public december grace occur',
      'year cargo muscle magic cycle patient tool salute season roast income surge',
      'orbit gate horse hurdle laundry recipe dish adjust moon avoid useful fork',
      'shaft jacket runway powder fantasy priority repeat common unique vacant audit pass',
      'horror depart rude girl orient donate hollow dad assault promote echo sponsor',
      'essence bracket excess wet crystal weasel pass bar shallow hill repair fan',
      'eager also tape notice genre mixture release aisle receive normal symbol buffalo'
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
  //   database: process.env.DBNAME || 'ddn',
  //   username: process.env.DBUSERNAME || 'root',
  //   password: process.env.DBPASSWORD || 'root', // Please use process.env.DBPASSWORD

  //   options: {
  //     // the sql dialect of the database
  //     // currently supported: 'mysql', 'sqlite', 'postgres', 'mssql'
  //     dialect: 'sqlite',

  //     // custom host; default: localhost
  //     host: '127.0.0.1',

  //     // custom port; default: dialect default
  //     // port: 12345,

  //     pool: {
  //       maxactive: 1,
  //       max: 5,
  //       min: 0,
  //       idle: 20000,
  //       acquire: 20000
  //     },
  //     logging: console.log,
  //     transactionType: 'IMMEDIATE',

  //     // SQLite only
  //     storage: 'db/blockchain.db',
  //   }
  // },

  /**
   * 扩展资产插件，对于区块链而言就是资产包，所以使用 assets
   * assets: [
   *  "@ddn/asset-evidence",
   *  "@ddn/asset-aob"
   * ]
   */
  assets: ['@ddn/asset-evidence', '@ddn/asset-aob', '@ddn/asset-dapp', '@ddn/asset-dao']
}
