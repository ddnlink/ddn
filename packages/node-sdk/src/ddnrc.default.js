/* ---------------------------------------------------------------------------------------------
 *  Created by Imfly on Sun Dec 29 2019 15:57:56
 *
 *  Copyright (c) 2019 DDN FOUNDATION. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */
const Sequelize = require('sequelize')
const Op = Sequelize.Op

module.exports = {
  /**
   * About Peer
  */
  port: 8001,
  address: '0.0.0.0',
  publicIp: '',
  logLevel: 'error',
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
      'attract viable organ future copy nerve twelve flag smart course unique version',
      'wash property between put split eternal future catch muffin alley clip afraid',
      'state fix ridge sleep regular find deny demise fatigue height cousin come',
      'blast hole raccoon trend outer clump bid crop audit immense syrup chicken',
      'brown sniff prefer custom kingdom kick comfort zebra parent detail brass liquid',
      'congress glove apart box under rack stairs fiber debris wise enable original',
      'hub slogan language category excite mansion consider topple cart sunset orient suspect',
      'thumb prize picture crystal task master siren tortoise soul box lava mountain',
      'buzz anchor reason plate message shove wall safe broccoli enough onion zone',
      'depart rebuild have dial helmet snow buffalo harvest portion fluid shy entry',
      'warm pudding rib favorite senior betray rebel mother suspect blood combine pudding',
      'method enter ketchup ordinary royal flight table true urban box common police',
      'love kangaroo pledge session minimum alone rate dolphin find vocal insect cloth',
      'bachelor moon sudden echo oyster tumble media problem combine sock survey script',
      'rotate gown radio best beauty rain umbrella cabin magic truth sniff weather',
      'minute miss picture wisdom silk supply kid frozen lounge library uncle tackle',
      'echo motor regret strike trial purity wife intact badge salute please sunset',
      'neglect move absorb jazz gesture make myth prepare regular possible music excuse',
      'pyramid dog measure fan cereal area eager write abuse snack shop autumn',
      'feature then afraid degree point weather predict afford liar basket stadium save',
      'feature vacant fashion era piece spell raccoon actress salon melt original truck',
      'harvest moral achieve chair there deposit process grid impose juice view strong',
      'seek antique desk source this evoke noise physical amused guilt venue fluid',
      'tiger bar betray picnic fancy aspect strategy world praise inhale boil cycle',
      'cup submit gun sure cash rather collect ask draw once reject grace',
      'flip rice copy assist replace evoke hybrid degree promote barrel mesh giant',
      'acid fault sauce dinner benefit analyst way want sure code month absorb',
      'lounge element suit deposit execute ride child ginger quantum around electric trap',
      'loop raven panther praise arch admit cereal traffic matter loyal wood unfold',
      'truck skill enter apple thunder humble kitchen cram apart tonight dismiss upset',
      'misery gorilla fit typical please grab ginger produce they keen close shrug',
      'tell multiply guilt pair estate smooth summer stone bronze common canoe clutch',
      'loyal divide quality physical odor portion smooth creek festival game soldier atom',
      'save orchard bar walnut near call game someone surface exhibit mutual copy',
      'doctor example pepper shoulder desk conduct price exchange insect one market misery',
      'female explain issue address moment hospital sad rival focus army measure smoke',
      'okay expose magic want yellow acoustic steak orange where model music convince',
      'disease diesel police almost fox domain wheat story radar proud saddle vapor',
      'fatigue cabin around blame ranch portion bargain hour forum frog giraffe simple',
      'glass lens pull brief used swap tumble short flavor pizza shuffle mask',
      'wink trade equip loan easily attitude oil tray into ozone danger aware',
      'often chuckle despair affair little mask ring quarter unit episode achieve shed',
      'ribbon garlic lucky believe industry basic plate moment fence unveil sadness forward',
      'liar arrive around hello vapor write scheme ocean liar input blanket rely',
      'street harsh knock empty typical exact metal emotion carpet learn armed shrug',
      'welcome rich bubble arctic axis holiday increase gate disagree buffalo small car',
      'absent hungry dutch shiver smile actress income knife awesome script cute raccoon',
      'topple review affair suffer cereal awesome peace crystal receive slush mushroom retreat',
      'child garlic left angry evoke indicate garage cancel mixed receive proof film',
      'enable knife involve cloth degree garbage cereal swap rice paper expire segment',
      'gift mesh card bike hour glare celery veteran jaguar sausage sock tag',
      'south noodle spider guilt later audit nasty grain alone often diagram tell',
      'inhale open armed rigid case waste ocean exhaust pass version beach crawl',
      'spring unveil apology burst govern other food robot core width turtle solution',
      'again scene upper order apology rich good upgrade panther six program romance',
      'egg torch amused dwarf foster nothing giggle what crouch general biology another',
      'cereal arrive flash short forest eagle burden little license enforce flock fresh',
      'apology own noble tragic scrap jealous super cycle lobster margin account marble',
      'nose bench phone wood gun wet pulse talent flame patient rail scissors',
      'sound pyramid cube undo parrot draw approve uphold pupil cave solid arm',
      'cabin under asthma recall gallery picnic disease choice maid olympic regret invest',
      'glad boy bamboo umbrella patch exact tilt laugh include shine quit initial',
      'limb shell trial unknown estate clever couple fancy tool useful narrow return',
      'blur jelly clap also sphere safe chaos mountain remind submit balance lend',
      'forward receive chase tiny brain helmet alpha ride faint curve life skirt',
      'cradle thing bar fluid online unveil digital six that major trouble gesture',
      'physical ostrich hollow pave remember prosper boat replace basic alien must ankle',
      'design frost nothing escape interest magnet roof carpet practice crime need salad',
      'title that demand return inner eye puppy combine foot toe base wreck',
      'reduce basic dove alien ability retreat dry rubber three law little myth',
      'toast pool end match dove cancel flock review tank find bracket mosquito',
      'gown collect eye purity vote hard surface prosper nation pizza extra hundred',
      'high frost tragic impulse reflect finish moral survey blast believe fresh stay',
      'surface radio blush problem payment such inflict unknown ceiling hidden dawn cat',
      'mimic critic brother spend employ alcohol panda goose spice long lobster bar',
      'crop stumble document ship click until love brush large find ripple van',
      'scatter future mass vault believe grass agree kid all lens divert lounge',
      'wheel hen buzz kind december else loan pulp erase spin coconut question',
      'gloom patch hurt typical valve punch wing general december vibrant drum yard',
      'local universe muscle state input steak cost foam giant chapter gap exile',
      'desert deliver spatial improve setup steel lamp dragon grain sun where hazard',
      'habit true depend timber wrestle top pole confirm job penalty during trumpet',
      'fruit volcano joy grow either real unfold reflect agree cactus position kangaroo',
      'buyer tray run motor hedgehog forward chat enlist banana duck prosper auction',
      'small slush have habit end scare offer nation sword suggest metal slim',
      'spin bike tell spike scatter attract rifle dice gesture frost clever time',
      'pupil kid album step boring begin nuclear attend bullet skate private plug',
      'sphere involve unfold post exercise monitor impose expose copy outdoor kind grocery',
      'chase crime poem flat keen letter cluster lottery pony private nominee patrol',
      'claw south apology design immune easy play patrol search life pistol furnace',
      'alter nasty frost diesel valid fiber warfare divorce income sphere film strategy',
      'park pact screen wreck walnut outside liberty very rabbit permit sentence text',
      'tuna raise report badge input coffee dog soul produce shy tray mask',
      'beach excite casual silly minimum thing jump supply maximum auto radio chronic',
      'shy crouch enact race spoil report tongue obey slow cage either discover',
      'fold since barrel silk orient term leader clarify orphan sell alley found',
      'build media exhaust address crush light mouse fold differ seek catalog usage',
      'scare primary hand spell parent truth wheat mistake always mirror limit fatal',
      'hurt into main game vast napkin mask abuse admit hat wise suit',
      'stereo invite party stick armed illness sight milk perfect chef mechanic offer',
      'nut crater mean palace awful feel mandate winter convince account noise wrestle'
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
  settings: {
    enableMoreLockTypes: true
  },

  /**
   * Database options
   * https://sequelize.org/master/class/lib/sequelize.js~Sequelize.html#instance-constructor-constructor
   * */
  database: {
    database: process.env.DBNAME || 'ddn',
    username: process.env.DBUSERNAME || 'root',
    password: process.env.DBPASSWORD || 'root', // Please use process.env.DBPASSWORD

    options: {
      // the sql dialect of the database
      // currently supported: 'mysql', 'sqlite', 'postgres', 'mssql'
      dialect: 'sqlite',

      // custom host; default: localhost
      host: '127.0.0.1',

      // custom port; default: dialect default
      // port: 12345,

      pool: {
        maxactive: 1,
        max: 5,
        min: 0,
        idle: 20000,
        acquire: 20000
      },
      logging: console.log,

      // SQLite only
      storage: 'db/blockchain.db',
      transactionType: 'IMMEDIATE',

      // Sequelize will warn you if you're using the default aliases and not limiting them
      // https://sequelize.org/master/manual/querying.html#operators-aliases
      operatorsAliases: {
        $and: Op.and,
        $or: Op.or,
        $eq: Op.eq,
        $gt: Op.gt,
        $lt: Op.lt,
        $lte: Op.lte,
        $like: Op.like,
        $in: Op.in,
        $is: Op.is,
        $gte: Op.gte,
        $between: Op.between,
        $not: Op.not,
        $contains: Op.contains
      }
    }
  },

  /**
   * 扩展资产插件，对于区块链而言就是资产包，所以使用 assets
   * assets: [
   *  "@ddn/asset-evidence",
   *  "@ddn/asset-aob"
   * ]
   */
  assets: [
    '@ddn/asset-evidence',
    '@ddn/asset-aob',
    '@ddn/asset-dapp',
    '@ddn/asset-dao'
    // 'asset-supervise'
  ]
}
