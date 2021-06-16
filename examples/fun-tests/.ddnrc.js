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
      'daring large wagon noise price offer predict crash resist avocado mail artefact',
      'gallery lawn champion boat rack clinic road link round trick castle runway',
      'creek must suit calm make bleak season example inquiry carpet payment trick',
      'other trade audit message shoulder satisfy review relax trap skill avoid latin',
      'asset round oven thing wall drink gym number income tired virtual damage',
      'ripple whisper ill vote use pitch evoke pass between coin frequent few',
      'enforce excess trick bleak bonus humor attend village wife desk ketchup lucky',
      'half life liquid sport shove stove category hobby open bone crouch whisper',
      'birth refuse coffee luggage panda cry disorder pyramid youth mushroom screen real',
      'actress guide off pitch employ enough ivory regret horror quality cabbage until',
      'kiwi asthma journey wink water erase rude output blur layer salt multiply',
      'urban explain assault increase please vacuum silver crew dry denial vault cliff',
      'steel supreme atom version pass mix unhappy wing carry bid mushroom artwork',
      'ski quit slide fitness soon nose hurdle honey select bind resource boy',
      'clutch sudden garage truth wheel test drive depart cute whip cross drip',
      'auto screen leaf member run wolf absurd amused width diesel virtual opinion',
      'better plate upper crucial clip tonight fury collect bike expect resist absurd',
      'reunion keen hire ski blossom nice spoon sell orchard grow sound cattle',
      'seven bargain abstract update unhappy degree stable suspect noble nephew slab memory',
      'derive tiger try estate ignore trial coffee poverty fresh title electric jeans',
      'grocery elder voice piece jungle ginger second poem custom job unit tomorrow',
      'traffic update frost bridge orient alcohol index average consider spike oval advice',
      'leaf text airport mechanic tattoo split gravity sail grape draw hill fall',
      'fix bounce pride inject wet street casual undo surround cancel rival warfare',
      'august window include run capital govern struggle diagram script visa sleep inner',
      'school arm try beauty entry pepper reunion elbow famous long purse toilet',
      'divorce accident anger bachelor junk verify host afford dad inch space bundle',
      'save soda upset mouse wire motor liar opinion employ plate ivory boy',
      'hello save lyrics extend flash loyal window live list bench split remain',
      'fade goose what say crop latin palm wish control twice benefit speak',
      'swear elephant disease emotion divide night there pumpkin nephew traffic marble corn',
      'vintage swim else fresh pass wage deposit input snap now slot liberty',
      'avocado curious era distance office trim relief please expire love outer brain',
      'join derive resemble high alien fan month material confirm gather despair carpet',
      'agent remove neglect develop blur brass conduct educate clutch genuine faint novel',
      'solar design nurse loyal real silver also second whisper art cheese dice',
      'pepper clown slam unlock fringe private jazz assault pottery cheese use execute',
      'eagle dinosaur fat regular traffic evil own hero envelope maze social relax',
      'absurd abandon flock stem smart bulb hint injury jungle casino grab keep',
      'suffer split festival blur mean sense electric sword general budget true lobster',
      'invest laundry hybrid vacuum hill grief wealth stick robust harbor circle cage',
      'candy act decorate eight monitor sphere noise picture cost during ribbon town',
      'visit achieve antenna wood basket unit feed notable license pencil silent patch',
      'cheese nice appear surround case time tell now airport parrot permit pause',
      'peanut boost melt salad sample final frown warfare island illness material level',
      'domain woman cost joy flight castle elephant exit endorse movie cat develop',
      'skirt almost axis material witness reform culture bamboo hazard duck youth dinosaur',
      'hire display voyage question help damp mirror route wall cube intact lens',
      'bachelor among penalty minimum oven invest maid fortune still concert journey way',
      'envelope cliff audit sword alarm entire happy gadget shiver begin myself supply',
      'donate list demise risk crazy garage amazing slab shock consider online burger',
      'that crew rigid heavy exercise cabbage wrap into advance globe cactus distance',
      'tooth sword random uniform text radio face twice entry force ship tumble',
      'glass arena mimic pattern cradle finish cable during thing athlete gallery great',
      'actual dolphin jewel sense word domain tell duck want unique sustain civil',
      'anger broom any gospel delay athlete enemy group heavy fold west chief',
      'level toddler provide belt sleep deputy coach one burst section rifle matter',
      'recall memory annual mammal castle air ahead aspect patch glimpse movie assault',
      'flock wonder illegal antique tragic table fire spot suspect remind loud buyer',
      'pass useless desk cute interest anchor bamboo magic friend roof web impact',
      'pave ghost pen satisfy hobby garage arrange style average segment claw upper',
      'damage swap pony caution april lady magic embark doll dizzy palace ladder',
      'feature kangaroo silver near hero leopard clinic gym daring subject carry under',
      'hero wrist forget craft van economy gather island limb peasant army hire',
      'valley rabbit grab fruit differ laundry volcano gesture all print bomb census',
      'mixture pizza pyramid rural mix coffee twenty follow street path middle into',
      'forget universe illness capital insane want wolf alpha assault chef film enter',
      'mother bar right guilt edge hungry monster toward salmon control oppose veteran',
      'coil muscle student provide vicious limit magnet trade voice tenant noble advance',
      'once collect mom divert midnight coin unaware above grid coin moon earth',
      'verb region panel cheese game state damage acquire humble analyst check tennis',
      'tiger wrist caution excess vessel crumble print cheap good wire become toilet',
      'tide loyal family million cloud silent hungry rescue loan glory airport boost',
      'lunch bunker awesome climb day wave tragic absorb pilot base invite dignity',
      'cabin screen topic kind blossom sheriff few lens truly furnace clog sure',
      'smooth author bridge eye love deer pipe badge toast afford quality minute',
      'one gauge plug execute glory gun orchard void extend illness kiss alpha',
      'junk symptom light feature truth sock ticket pull run exist divide wise',
      'force oil burger game nurse reveal present matrix when index thrive napkin',
      'mango stone bag improve ripple blame city wing twelve myth hazard ivory',
      'wash escape captain history minimum vibrant hope hospital face awake dismiss comfort',
      'top prosper tilt clip coin cage settle tag radio surface picture junior',
      'citizen gain wood ivory shuffle stove word surge hair hole eagle water',
      'pair open similar bracket outer width mandate report purchase govern online cinnamon',
      'power bundle column trophy violin area banana token head faculty tennis cloud',
      'morning either bus tiny message critic only false depth similar filter sting',
      'brass tonight prevent suspect same parrot oblige beef viable puppy coin rocket',
      'picnic either praise solid upon mix buzz lounge neutral market abstract crazy',
      'calm sample pistol corn yard egg baby grief noise tumble can puzzle',
      'toward narrow armed since onion thunder leaf wrestle kitchen clean figure dolphin',
      'judge myself suffer muffin depend because sudden rate dream palace garden pen',
      'luggage lady degree name search midnight hotel afraid stereo diamond sing virus',
      'blood say sausage laugh gadget common because logic tool emerge nest north',
      'blade giggle dwarf exile pear explain like poverty acquire side budget opinion',
      'situate pen mutual way dragon easy glide weather mean powder snack city',
      'parade usual various two treat lady old shrug pear gym kick steak',
      'stone comfort display supply planet seed abandon journey perfect vicious relief enrich',
      'game cave number math pizza hamster tuition gun supply lend primary ill',
      'train sample private matrix hello chalk until weekend spice waste test robot',
      'update air skirt quote father fog machine cost art antique sock outer',
      'ball mule giraffe shallow will stick urge number phrase actress clever leave'
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
