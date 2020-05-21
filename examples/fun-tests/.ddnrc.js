/*---------------------------------------------------------------------------------------------
 *  Created by Imfly on Sun Dec 29 2019 15:57:56
 *
 *  Copyright (c) 2019 DDN FOUNDATION. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
const Sequelize = require("sequelize");
const Op = Sequelize.Op;

module.exports = {
  /**
   * About Peer
  */
  port: 8001,
  address: "127.0.0.1",
  publicIp: "",
  logLevel: "error",
  net: "testnet",
  nethash: "0ab796cd",
  payloadLimitSize: "8mb",

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
      "purchase outside erase swamp old opera february drift they chase hammer stamp",
      "girl foam cat canoe inject tip inherit seek business blouse kitten grace",
      "luggage derive canoe vicious shoe glance trash glass grocery cricket company anchor",
      "expect guess genre phrase grow music board erupt life pilot skate quality",
      "hub urban spawn acid air enjoy lizard credit shy economy saddle family",
      "powder weapon thunder humor fossil script spatial local swim market farm away",
      "relax magnet speed weasel cool lazy permit economy tone milk cup strategy",
      "know any short betray improve prison horror state inform grace soft lonely",
      "urge topple describe detect tower stereo bid wet surprise disease unaware echo",
      "memory sing element custom ocean breeze view luxury cliff hope chair shuffle",
      "object visa door easily only scrub domain eager erode chest butter door",
      "sure lonely claim old clock market purchase laundry baby twenty explain lobster",
      "dilemma field jump success lunar coral craft gospel crush payment defense extra",
      "romance clutch stadium test inner defense mango vast evoke town potato push",
      "photo flee slice dust earn draw element dentist addict kitchen salon proof",
      "stamp excess giant huge glare purchase olive exercise issue proof unlock glance",
      "meat gift popular fury divorce novel web motion consider sick august false",
      "velvet hunt giraffe wheat february flower giant thunder table promote inner kite",
      "dizzy blush twelve promote clock lucky wreck unusual grunt meadow sorry uncover",
      "spy pretty donate dune pigeon nation switch delay negative sting obscure arrive",
      "payment window solve evil rely harvest feed right lady trade water chimney",
      "health whisper crane airport destroy concert usual trouble truck thank canvas bench",
      "fly alpha year cram holiday artist meat crawl medal trick adjust heavy",
      "slam battle iron fatigue future zebra type tip predict wreck develop spray",
      "leaf upper away ivory office potato fox peanut athlete session black hedgehog",
      "plug neck check latin music name magic road apart mass load clerk",
      "convince crucial wide eye swamp essay brave orbit arrow profit exhaust stool",
      "hair venture evidence acid crack depend theme warm position wagon vanish evil",
      "exit enforce position message embrace april prepare sell tourist attitude cereal high",
      "shallow tower best about barely wage morning enjoy cycle food horror they",
      "cruel tool elegant panda allow attract comfort daring guard shift subject safe",
      "nerve tower subway promote render normal harbor tank vocal build false wave",
      "stove forget abstract tackle course submit color quote summer flat picture bargain",
      "bright lake tornado focus suffer left time funny acid trap diamond ancient",
      "charge more negative proud broccoli tissue bulb super pilot acquire machine random",
      "husband ball will unveil soap village wool height reduce vessel ship visa",
      "slush garment swamp spot water inflict noble person session behave egg short",
      "layer muffin leave exist will discover donor rival fragile chef input photo",
      "sphere grow domain embark video talk inspire aspect eternal gather second earth",
      "rebel broccoli happy jeans cloth absorb course rely movie tennis crash timber",
      "stock stadium urge dial era sound wage scrub silver amused head gift",
      "play stairs appear agree ensure twice rabbit crucial rookie attitude whisper quick",
      "wisdom brush among need tell number door enrich frog rib hundred movie",
      "evil laptop text muscle buyer before inflict all shell regular inch shop",
      "cargo increase marriage spike wide chimney mail harsh advice nut injury panther",
      "rain develop slab pelican unique attitude dial peace recycle salt celery slice",
      "corn vacant refuse wild post frog ahead ten bounce mushroom mutual fresh",
      "over coconut hockey cousin spirit word repeat leave luxury key rib effort",
      "stock minor wear camp figure anger inject glove kangaroo demand evolve around",
      "grief pistol orphan topic eternal extra general army always hungry earn milk",
      "wrong reopen hurdle put genre skate cheap loyal balance label net sudden",
      "cream neither approve narrow wear crime theory affair tourist hospital injury luggage",
      "habit true there rent nothing horror veteran mule raven foil foam defy",
      "direct glare naive seek powder blouse gain lumber day add section provide",
      "interest pistol loop work humble sauce trust drip public corn jewel girl",
      "million cushion spend history anxiety width wet behind diet pink brown walnut",
      "vacant vendor whisper urban typical target leopard rabbit grass ill ribbon fringe",
      "body age focus demand sphere wire aim royal elbow escape planet mixture",
      "charge stereo arctic collect home manual immune main tunnel wrong air toy",
      "still vibrant bless fame dragon fringe mesh cannon inhale horn start require",
      "ranch sad board cigar hand more rocket siege story fringe bacon scrub",
      "foam avocado rack crack garlic lawsuit news crack visual during surprise orient",
      "earn void tumble focus tone alcohol cat predict citizen victory match midnight",
      "sleep luxury seek expire same winner model fringe step vote sick practice",
      "culture insect taste then payment crouch scan argue chef scissors tilt faint",
      "clean item vibrant gallery gossip stem fall affair wreck among solution achieve",
      "alter mask almost dry ranch urge initial page escape decline stumble luggage",
      "torch allow off brick acid raccoon copper slab gown kitten era verify",
      "lumber attract magnet fee anger cinnamon despair lounge moral valid blade alert",
      "evil radio split stool film initial blind income voice jaguar material sibling",
      "wage polar rule raccoon immense absorb august bonus bridge mixture morning daughter",
      "robot concert poet stairs taxi during depart quiz hamster nurse unveil key",
      "eternal that left ginger quiz demand actual focus economy clump swallow choice",
      "minimum liberty lesson addict coral jungle belt chimney defy stove paper panic",
      "tennis rare essay rhythm merit off need venture raccoon jealous wedding clown",
      "eternal normal burden flush theme item armed random few conduct bring excess",
      "junior vehicle tuna school clock topic supreme soap call buzz motor crush",
      "brown subject pupil shock smoke blanket bring march beach rally head member",
      "humor story inner garbage clerk atom number certain abuse glare maid tunnel",
      "actress rubber must float clump spoon patrol duty rebuild interest novel mass",
      "corn poem twin faculty labor oblige dilemma hello pupil leave lava ill",
      "erode afraid quiz whale nominee toy afford relax employ leg tunnel maid",
      "stamp story egg wedding bus runway slim bundle merry lunch advice zoo",
      "tilt dynamic private small giraffe arrive weekend bridge mesh peanut okay indicate",
      "aunt typical demand athlete target plug tongue away response sure reject between",
      "table member give twenty snack smooth couch soccer lecture dumb toss club",
      "accident maple couch marriage card exact supreme junk time pencil wage gentle",
      "amused usage reason repair park deputy push hole digital wood all follow",
      "december double aisle powder target film fruit own oven confirm miracle copy",
      "rescue speak opera pond voice among two keen legal addict robot disease",
      "eager rhythm laundry dignity notable lend picnic trend blanket lizard outside buyer",
      "lamp lens bubble right humor party border recall slot change member skill",
      "aim almost dwarf deer people nature garden crowd print tumble sketch position",
      "dirt sibling author session best expect truly can income student junior radio",
      "review cheese hockey hundred fiscal anchor chat victory bird brain humble ugly",
      "always mix crane height attract crack school barrel valve control depend year",
      "crumble boost wife double runway peasant saddle ecology prefer hunt near parent",
      "glance unable ask camp elegant drop inch space dragon knock thunder fruit",
      "high civil learn ready bronze grief learn wrong swallow that peanut romance",
      "sun wedding country success birth echo clerk hospital crack fuel hello awake",
      "worth false mirror digital clerk repair search neck joke patient village crumble"
    ],
    access: {
      whiteList: ["127.0.0.1"]
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
      address: "0.0.0.0",
      key: "./ssl/server.key",
      cert: "./ssl/server.crt"
    }
  },
  dapp: {
    masterpassword: "xS5XaSoHsTEL",
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
    database: process.env.DBNAME || "ddn",
    username: process.env.DBUSERNAME || "root",
    password: process.env.DBPASSWORD || "root", // Please use process.env.DBPASSWORD

    options: {
      // the sql dialect of the database
      // currently supported: 'mysql', 'sqlite', 'postgres', 'mssql'
      dialect: "sqlite",

      // custom host; default: localhost
      host: "127.0.0.1",

      // custom port; default: dialect default
      // port: 12345,

      pool: {
        max: 10,
        min: 1,
        idle: 10000
      },

      // SQLite only
      storage: "blockchain.db",

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
    "@ddn/asset-evidence",
    "@ddn/asset-aob",
    "@ddn/asset-dapp",
    "@ddn/asset-dao"
  ],
};
