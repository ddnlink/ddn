/**
 * Please use yourself constants file
 * Note: Once the mainnet is online, this file can no longer be changed.
 */
export default {
  nethash: '0ab796cd', // 标定该链的版本
  tokenName: 'DDN',
  tokenPrefix: 'D',
  maxAmount: 100 * 10 ** 8,
  fixedPoint: 10 ** 8,
  totalAmount: '1000000000000000000',
  foundAddress: 'DLjrrVwnmMXstcAYVjcrpwyYb3kY1ehABU',
  walletUrl: 'http://wallet.ddn.net',
  enableMoreLockTypes: true,

  interval: 10, // 10ms
  delegates: 101, // number
  superPeers: 21,
  voters: 67,
  remoteVoters: 6,
  maxPayloadLength: 8 * 1024 * 1024,
  blockHeaderLength: 248,
  addressLength: 208,
  maxAddressesLength: 208 * 128,
  maxClientConnections: 100,
  numberLength: 100000000,
  maxRequests: 10000 * 12,
  requestLength: 104,
  signatureLength: 196,
  maxSignaturesLength: 196 * 256,
  maxConfirmations: 77 * 100,
  confirmationLength: 77,
  maxTxsPerBlock: 500,

  energyPerDDN: 10000,
  gasPrice: 1,
  maxGasLimit: 10000000,
  maxCodeSize: 32768,

  crypto: '@ddn/crypto-nacl',

  rewardRatio: 0.2,
  milestones: [
    '500000000', // Initial Reward      Bignum update
    '400000000', // Milestone 1
    '300000000', // Milestone 2
    '200000000', // Milestone 3
    '100000000' // Milestone 4
  ],
  beginDate: new Date(Date.UTC(2017, 11, 20, 4, 0, 0, 0)), // 主网上线：2017年12月20日中午12点（+8)
  rewardDistance: 3000000, // Distance between each milestone
  rewardOffset: 1, // Start rewards at block (n)
  // If you have some different thing, Please set the compatibleVersion.
  compatibleVersion: '0.0.0', // Peer isCompatible?

  // Fees for transacton
  fees: {
    // base
    transfer: '0.1',
    vote: '0.1',
    delegate: '100',
    signature: '5',
    multiSignature: '5',
    lock: '0.1',

    // aob
    aob_issuer: '100',
    aob_asset: '500',
    aob_flag: '0.1',
    aob_acl: '0.1',
    aob_issue: '0.1',
    aob_transfer: '0',

    // dapp
    dapp: '100',
    dapp_out: '0.1',
    dapp_in: '0.1',

    // contract
    contract: '1.0',
    contract_transfer: '0.1',

    // todo: 测试中提供的费用
    username: '0.1',

    // dao
    dao_confirmation: '1',
    dao_contribution: '1',
    dao_exchange: '0.1',
    dao_org: '0.1',

    // evidence
    evidence: '0.1' // fixme
  }
}
