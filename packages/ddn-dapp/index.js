module.exports = {
    Dapp: require('./lib/dapp').default || require('./lib/dapp'),  // type: 11
    InTransfer: require('./lib/in-transfer').default || require('./lib/in-transfer'),     // type: 12
    OutTransfer: require('./lib/out-transfer').default || require('./lib/out-transfer'),     // type: 13
    DappCategory: require('./lib/dapp/dapp-category').default || require('./lib/dapp/dapp-category'),
    DappType: require('./lib/dapp/dapp-types').default || require('./lib/dapp/dapp-types')
}