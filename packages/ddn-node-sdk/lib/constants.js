module.exports = {
  fees:{
    send: 10000000,
    vote: 10000000, 
    username: 10000000,
    multitransfer: 10000000,
    domain: 10000000,
    
    delegate: 10000000000,
    secondsignature: 500000000,
    multisignature: 500000000,
    dapp: 10000000000,

    // dao
    evidence: 10000000, // fixme
    org: 10000000,
    exchange: 10000000,
  },
  coin: 100000000,
  nethash: {
    // ddn testnet
    '0ab796cd': {
      tokenName: 'DDN',
      tokenPrefix: 'D',
      beginDate: new Date(Date.UTC(2017, 10, 20, 12, 20, 20, 20)),
    },

    // ddn mainnet
    'b11fa2f2': {
      tokenName: 'DDN',
      tokenPrefix: 'D',
      beginDate: new Date(Date.UTC(2017, 11, 20, 4, 0, 0, 0)),  // 主网上线：2017年12月20日中午12点（+8)
    },

    // EOK testnet
    'fl6ybowg': {
      tokenName: 'EOK',
      tokenPrefix: 'E',
      beginDate: new Date(Date.UTC(2018, 5, 18, 4, 0, 0, 0)), // 2018-06-18T04:00:00.000Z +8
    },

    // EOK mainnet
    '315by9uk': {
      tokenName: 'EOK',
      tokenPrefix: 'E',
      beginDate: new Date(Date.UTC(2018, 5, 18, 4, 0, 0, 0)), // 2018-06-18T04:00:00.000Z +8
    }
  }

}
