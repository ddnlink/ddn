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
  p2pPort: 9001,
  crypto: '@ddn/crypto-nacl',
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
      'account cycle reflect retreat donor once mansion quote staff airport zero enable',
      'please tragic gesture distance immense supreme amused weasel auto bag glad rate',
      'roast minimum leave they there charge blast grace gown faculty hood aware',
      'perfect age spell digital pretty engage hope tattoo mimic network outdoor mesh',
      'plunge cave taste cargo village use art conduct aerobic hard obvious zone',
      'edit lady control echo steel suggest smooth shed hybrid cushion length adjust',
      'mask auction follow model sustain ramp van avoid off bright trend critic',
      'badge kick kite december frequent vibrant move nothing know praise harvest genius',
      'mountain broken quiz zoo slot shell paddle guide weekend labor battle gallery',
      'claim thrive topple patient eye drink harsh explain human never trash barrel',
      'reduce cook eyebrow kangaroo endless mass fatigue recipe trip health duck voice',
      'loop flower volcano aware narrow bag token race conduct custom cabin pledge',
      'alarm fantasy cactus coconut point veteran name silver raccoon believe size buzz',
      'imitate legend busy uphold easily almost stumble danger ginger guitar snap shy',
      'shoulder afraid armor soldier excite capable rebuild sport turtle chat clump also',
      'van swift display example wolf gadget empty oval comfort used visa luxury',
      'vehicle ship fold shaft inherit educate grit toilet nephew connect pulp thought',
      'umbrella ladder among neutral come spice word almost insane fork drastic crowd',
      'ball pretty gravity puzzle bird silver urge elegant leader arch link hospital',
      'borrow powder flip marble kit bird lawn rapid defense adjust ill little',
      'weasel virus dynamic stay useful margin there dad pelican surprise derive neutral',
      'banana enrich promote eternal grant sugar renew either feel atom myself victory',
      'auto orphan rebel skill media inspire trophy wreck track dinosaur traffic music',
      'fog frost float once fiction tourist fringe promote basic hawk dumb slow',
      'bachelor barely amateur park produce jeans soda ship valley proof owner unfold',
      'ostrich person success label time sting need garment robot clever sing debris',
      'east wheel capable flag topple admit dial crowd crater chef burger piece',
      'weapon doctor cost chase mutual oppose sibling spider place floor payment van',
      'current sauce hour surprise bacon race awake frown room length turkey live',
      'first heart fabric health hurry tribe river ginger tomorrow venue ankle mixed',
      'ridge illegal online picnic voyage ivory patient surround minute hazard ankle exclude',
      'rabbit cable lift aunt various pyramid drink lecture region pelican evil badge',
      'plastic ignore knee hill stand shift reason bright hint video make skill',
      'lounge easily that measure vital hawk donkey mule notable quick giant bring',
      'animal vote mule mention exhibit exchange merit tuition cinnamon area nuclear cook',
      'wreck general bubble immense distance thing eyebrow rebuild leaf side burger ten',
      'hungry just theme level tray sell text story notice ecology gather adjust',
      'wrestle faith protect remember chronic lens hospital voice job tuition entry cave',
      'crucial volume cycle glass drum direct feature news fee wealth sorry myself',
      'runway creek master educate eternal venture half valid project loop tube make',
      'exist robust nice obtain win minute cave science table length inform skull',
      'banner meadow prefer crush topic remind warm cart label dog salmon finish',
      'use because million level skirt dismiss noise effort funny decade camp balcony',
      'across spatial wrap try water lunar rich birth coach describe give island',
      'wife absorb draw lesson tragic suffer garment theory certain state acoustic during',
      'casual pyramid exit kingdom fence brisk sentence tray equip mandate odor supply',
      'merit roast opinion ticket today shoe street food traffic sniff census chase',
      'trash clip train crazy round ill absorb that arrow trip hair security',
      'clutch hold wise curious photo scrub notice float purchase click rare option',
      'input strategy leaf there master violin feed reward casino pepper expand busy',
      'nerve coral print flee cry onion patient now mail grid conduct novel',
      'purpose swear bullet firm pipe rely among nest arctic depth noble card',
      'sting tennis soft gain faint trouble long peanut ridge body domain element',
      'fork fetch worth one roof lab dune glue wine timber game brother',
      'column point apart major surround aware embody wire broccoli section need energy',
      'model drive front snake goddess stick save broom stool crack vicious circle',
      'toward pupil silent vintage advance leaf leave fashion access crucial tray distance',
      'paddle pink pool exit swamp other say isolate train absorb abuse car',
      'gospel west charge embark else smart chronic wreck ship own mixed oyster',
      'elephant student ribbon joy place wrestle have maze behind route huge ladder',
      'share much swarm latin coconut frozen install claim tumble trial ladder detect',
      'sunset all trust conduct supreme service skirt pill orphan journey cotton response',
      'figure oil senior amount dumb choice upgrade hundred tired crisp gold organ',
      'copy also tide live replace select glance dirt roast real breeze because',
      'spell elevator clever basket awesome gallery laugh truly illegal source escape spice',
      'link maid raven source tuna volume tube parent possible faint wear cloth',
      'embrace this man loan siege control unable fiber jeans future lawsuit entry',
      'wide correct enemy energy senior million easy fantasy hand estate grab lizard',
      'hat lecture spirit search message struggle parade average ticket enable mother type',
      'pear render minor panther case prepare recipe double fold sadness wait icon',
      'antenna emotion chest room smile cigar skirt globe minor actress vague round',
      'popular guitar cigar code provide muffin square clown crisp canvas load giraffe',
      'creek lift obvious boil daughter mixed hire evil major dream trick clarify',
      'mirror distance erase cannon alone dinner pigeon famous topic license offer jump',
      'hour share same trophy city program gown gossip gentle potato stay twenty',
      'resist great congress urge glory uniform soul kiwi discover clarify boat bone',
      'fault volume siege special duck sponsor awesome couch oxygen life blade frame',
      'file join render entire execute piece man primary tail cute denial basket',
      'husband minor video fancy owner educate spell cake solve twelve letter review',
      'minimum venue trash girl tornado autumn fox toss spread ice glory problem',
      'steel monitor fold bamboo soul cliff shallow flavor staff mixture nut crime',
      'dignity anger capital impose solid group snack prevent across common shy this',
      'anxiety scout property mind attend square text guilt erase carry core very',
      'approve fork short country pull bright shaft sausage myself acquire toast narrow',
      'panther trim credit silk unlock animal artist senior honey arctic prize zoo',
      'swing kick fox sample arch mean pond ancient foam pride artwork print',
      'unhappy easy eight upset party dance chronic claim flat save penalty artwork',
      'always welcome cloud square stomach almost one three pudding army traffic trophy',
      'main oval annual turn radar merge badge tuition junior afraid lottery lounge',
      'frequent capable vehicle cash random bright innocent during citizen car castle mobile',
      'cancel lawn topple mad swarm chuckle purity allow fringe immune must entry',
      'circle vocal school rookie august novel tooth initial category field decade will',
      'devote void mesh brother gorilla figure unfold base rent van boost always',
      'fitness olympic famous artefact plate kiss song much hover powder mushroom husband',
      'actual thought sell name memory memory host fancy congress future meadow prison',
      'dutch exit motion rich grape sand radar solar add warrior ramp hood',
      'labor erupt update observe life twice elder list slogan outdoor element weapon',
      'other nothing opinion parent latin valid avocado actual soap reduce burden squeeze',
      'twin lucky fame cart square helmet alley tuna relief cave spike energy',
      'latin artwork call cube version ostrich spirit trumpet orient other pitch candy',
      'remember slim wagon bread craft slogan off drift stage custom exclude olive'
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
  assets: ['@ddn/asset-evidence', '@ddn/asset-dapp', '@ddn/asset-aob']
}
