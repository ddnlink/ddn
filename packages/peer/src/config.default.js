/* ---------------------------------------------------------------------------------------------
 *  Created by Imfly on Sun Dec 29 2019 15:57:56
 *
 *  Copyright (c) 2019 DDN FOUNDATION. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */
import Sequelize from 'sequelize'

const Op = Sequelize.Op

export default {
  /**
   * About Peer
  */
  port: 8001,
  address: '127.0.0.1',
  publicIp: '',
  logLevel: 'info',
  net: 'testnet',
  nethash: '0ab796cd',
  payloadLimitSize: '8mb',

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
      'lake kitten arrow elephant because entire club rug unique climb club arrive',
      'frog foil road lab skate mother height arrow secret allow shell found',
      'surprise thrive maple salmon absent chest act easy stomach drill permit trophy',
      'various target bike stumble company hockey surround guess exact sponsor ginger pig',
      'nose seminar issue gentle avoid drink eight skate into damage joy wish',
      'dutch egg balance connect shed vast snack banana paper climb allow tornado',
      'gas abstract blame timber drama sting fancy solar census useless ranch cage',
      'script clean aerobic possible armed example iron ugly brain detect piano emerge',
      'click goddess turkey biology please capable cloud test polar spider sight gloom',
      'romance weekend invite dance proof danger boring chicken sun coil lava wheat',
      'beef put camp chronic glow random wet leg woman crime tissue social',
      'law soul baby visa emerge antique spot outer degree melt illness trial',
      'jewel ski receive ensure rule mesh barely wear update need canyon flash',
      'bulb dolphin high merit buddy palm tunnel thing camp dry legend rare',
      'favorite false avoid focus open harvest someone give scrap lift gas sight',
      'behave glare under erase sport legal patrol grass remind local neck cage',
      'tail ordinary travel gold draw weird degree one require guard spike ring',
      'ill finish grace grit orphan unhappy mobile athlete peace child walnut warrior',
      'topple gaze will picture grocery slab clump ugly sunset monkey express accuse',
      'abandon essence runway apart source sniff neglect mammal benefit parade clip blouse',
      'ill neglect pact shoe find burden hand ostrich wealth crumble season trip',
      'celery either letter runway menu tree struggle jelly soul truck alcohol space',
      'ready attract cover enlist panther bag effort snake input laugh foot innocent',
      'thrive warm amused universe asthma decrease chief robot broom tent peace phone',
      'combine sock artist modify safe lab exile harsh trap slide verb myth',
      'popular demand fat exercise okay legal rude dinner moment twelve obscure couple',
      'seat load subject blind wreck thought shy twenty drum arrange funny panic',
      'victory drop wear swarm list ranch cart spray jazz quote marriage receive',
      'daring parent slush chaos jelly honey exclude interest rubber tuition island promote',
      'hazard museum kitten embark vanish race matter weapon page cook parent toward',
      'lesson absurd width word size endless country canyon ready addict then bamboo',
      'scan shock board insane youth vast update foil cattle apology resource announce',
      'wonder group humor favorite happy real coyote camera follow inch news slam',
      'typical sleep object fever situate cactus luxury increase series fiction follow nature',
      'island bulk hazard dilemma bench goose ski clay under annual possible typical',
      'kick drill athlete flower very reason pudding husband alcohol monitor amateur shop',
      'laugh lunch focus payment comic project shrug dust jungle hero keep differ',
      'analyst picnic room achieve lucky record thrive recall comic concert flash island',
      'resist timber prepare network mix walk illness indoor general parade curve cigar',
      'noise glad weekend motor dose fortune boat april ozone before library wall',
      'expose horror glow useful rebuild cotton burden trumpet yard category indoor high',
      'put spot bargain humor impose conduct sketch jungle alert salute stay margin',
      'lizard blood huge sign light flavor brick project wise food snow crane',
      'furnace increase change attitude spike only pair supply donor sense chicken annual',
      'cherry submit reopen measure clump service come refuse debris fatal diet craft',
      'adjust person dice oppose impact gold dust must aisle pioneer wall champion',
      'regular sorry own cactus matrix helmet vehicle kit lunar ride whisper output',
      'bleak behave crowd attack library diamond fatal entire quality lizard buyer celery',
      'trumpet cause fringe trust permit table dress food awkward puppy web output',
      'body story salt clean jacket bonus carpet abstract captain leave later type',
      'identify foot museum focus bleak click plate surge myth joy client inner',
      'curve abuse hedgehog more vendor dilemma child punch series document allow fade',
      'connect earn bubble hole echo great prize scrub object dune become fetch',
      'ranch blind bacon quiz depend keen vicious record blur situate crumble beyond',
      'assume final tattoo output sand strategy always tiny wage use phrase turkey',
      'train machine brand lizard oak lift rotate leave snake gaze leave nature',
      'exotic peasant awkward host sunset quiz brother sadness nominee focus defy obey',
      'rose festival slogan cattle crazy crucial lecture funny fuel pool grant fold',
      'bind lemon bomb galaxy address defense minute whip nerve innocent sauce input',
      'guess despair crowd resemble snow dish stock rug claw husband shallow vault',
      'narrow glide limb sight trash library suit afford flip burger weekend cube',
      'notable disorder great spread drip crash two black day other unlock floor',
      'cloth genius sudden myth scissors addict put happy measure since climb upon',
      'buffalo nose drastic horror lava often coffee order gate wash decline bench',
      'own still sail palace ugly carry unable jump include figure unique abstract',
      'letter cool fiction exchange resist spray magnet waste soup opinion mammal parent',
      'hammer easy hammer okay damage lake relief simple trial safe practice gift',
      'fee shoot tired promote unit opera ensure joke bar stadium loop mechanic',
      'someone high give addict tip six dream music peace bargain safe time',
      'hedgehog behave giant long bleak scatter hat unveil aspect snack sell tortoise',
      'scheme have brisk boss romance foster satisfy board custom craft meadow comic',
      'artwork always obvious broom bicycle cover awful party garlic sniff trend job',
      'current duck ribbon glory derive laptop spoon oppose market olive brisk cloth',
      'regular portion century picnic gym lunar boat river tomorrow duck juice area',
      'employ define reward jungle length current idea park output together market december',
      'this spider outside digital airport join vanish mom exclude bomb fiction place',
      'company glass citizen inquiry science pig phone employ entire basket ranch ordinary',
      'garbage real because road donor mule broken sea cream orient close emerge',
      'place grocery rigid stumble swamp seat same play mosquito glory code pluck',
      'taxi surge fault domain erosion index picnic stereo brown cotton dash route',
      'curtain decorate leisure install absent flag pattern spy coconut parent saddle choice',
      'reveal ankle arrive paddle nasty frozen expire grain mansion genuine aspect fossil',
      'wrestle usage general lazy income motor robot knock fruit face addict stamp',
      'aspect spot update dismiss regular off payment twice design bird globe include',
      'install bamboo bind economy drop occur rubber pulp small income hamster smoke',
      'usage blossom vivid surround lady relax genre script wish brown spring round',
      'country carry hold cause network time trim task music pulp innocent grunt',
      'lock riot caught prosper pioneer fabric turkey that special truly dial kingdom',
      'permit document frown stuff east dentist robot blur color reveal try jungle',
      'wild addict plate unknown mutual amused merge canyon tip mixed surface rent',
      'employ depth correct sauce under fiber ethics forget pyramid sample lemon arch',
      'furnace female knock mushroom kidney film expose bread matter gesture repeat task',
      'turkey tower seek penalty wing industry mean enter toward long light edit',
      'flee snack lab garbage imitate tiny grit pistol cute alter story portion',
      'hurry census denial submit certain peanut weapon bulb skull pioneer appear hint',
      'cherry motion panda meadow click course surround gossip rocket popular deer silk',
      'report stuff system scheme security book pluck index modify flower attend shop',
      'toward weapon judge twice two wine salmon primary attract public stool crawl',
      'agent subject sense nice very chat pave annual frog legal side nuclear',
      'elite sunset cake shaft human cradle remember select flame panther tongue ancient',
      'shrug yard energy zoo test wasp pilot merry shove around pet young'
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
    enableMoreLockTypes: true,
    delegateNumber: 101,
    blockIntervalTime: 10
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
        max: 10,
        min: 1,
        idle: 10000
      },

      // SQLite only
      storage: 'blockchain.db',

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

        // ---
        $ne: Op.ne,
        $gte: Op.gte,
        $not: Op.not,
        $notIn: Op.notIn,
        $notLike: Op.notLike,
        $iLike: Op.iLike,
        $notILike: Op.notILike,
        $regexp: Op.regexp,
        $notRegexp: Op.notRegexp,
        $iRegexp: Op.iRegexp,
        $notIRegexp: Op.notIRegexp,
        $between: Op.between,
        $notBetween: Op.notBetween,
        $overlap: Op.overlap,
        $contains: Op.contains,
        $contained: Op.contained,
        $any: Op.any,
        $all: Op.all,
        $col: Op.col
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
  ]
}
