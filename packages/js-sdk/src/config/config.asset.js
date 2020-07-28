export default {
  '@ddn/asset-evidence': {
    transactions: [
      {
        name: 'Evidence',
        type: 20
      }
    ]
  },
  '@ddn/asset-aob': {
    transactions: [
      {
        name: 'AobIssuer',
        type: 60
      },
      {
        name: 'AobAsset',
        type: 61
      },
      {
        name: 'AobFlags',
        type: 62
      },
      {
        name: 'AobAcl',
        type: 63
      },
      {
        name: 'AobIssue',
        type: 64
      },
      {
        name: 'AobTransfer',
        type: 65
      }
    ]
  },
  '@ddn/asset-dapp': {
    transactions: [
      {
        name: 'Dapp',
        type: 5 // 11
      },
      {
        name: 'DappIn',
        type: 6 // 12
      },
      {
        name: 'DappOut',
        type: 7 //  13
      }
    ]
  },
  '@ddn/asset-dao': {
    transactions: [
      {
        name: 'DaoOrg',
        type: 40
      },
      {
        name: 'DaoExchange',
        type: 41
      },
      {
        name: 'DaoContribution',
        type: 42
      },
      {
        name: 'DaoConfirmation',
        type: 43
      }
    ]
  }
}
