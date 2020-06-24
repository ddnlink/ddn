/**
 * Please use yourself constants file
 * Note: Once the mainnet is online, this file can no longer be changed.
 */
export default {
  nethash: '0ab796cd', // 标定该链的版本
  tokenName: 'DDN',
  tokenPrefix: 'D',
  foundAddress: 'DLjrrVwnmMXstcAYVjcrpwyYb3kY1ehABU',
  walletUrl: 'http://wallet.ddn.link',

  interval: 10, // 10ms
  delegates: 101, // number
  maxAmount: 100000000,
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
  fixedPoint: 10 ** 8,
  totalAmount: '10000000000000000', // Bignum update
  maxTxsPerBlock: 500,

  testnet: {
    rewardRatio: 0.2,
    milestones: [
      '500000000', // Initial Reward    Bignum update
      '400000000', // Milestone 1
      '300000000', // Milestone 2
      '200000000', // Milestone 3
      '100000000' // Milestone 4
    ],
    beginDate: new Date(Date.UTC(2017, 10, 20, 12, 20, 20, 20)), // testnet
    rewardDistance: 3000000, // Distance between each milestone
    rewardOffset: 1, // Start rewards at block (n)60480
    compatibleVersion: '0.0.0', // Peer isCompatible?

    // Fees for transacton
    fees: {
      send: '10000000',
      vote: '100000000',
      secondSignature: '500000000',
      delegate: '10000000000',
      multiSignature: '500000000',
      dappRegistration: '2500000000',
      dappWithdrawal: '10000000',
      dappDeposit: '10000000',
      data: '10000000',

      // todo: 测试中提供的费用
      username: '10000000',
      multiTransfer: '10000000',
      dapp: '10000000000',

      // dao
      evidence: '10000000', // fixme
      org: '10000000',
      exchange: '10000000'
    }
  },

  mainnet: {
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
      send: '10000000', // Bignum update
      vote: '100000000',
      secondSignature: '500000000',
      delegate: '2500000000',
      multisignature: '500000000',
      dappRegistration: '2500000000',
      dappWithdrawal: '10000000',
      dappDeposit: '10000000',
      data: '10000000',

      // todo: 测试中提供的费用
      username: '10000000',
      multiTransfer: '10000000',
      dapp: '10000000000',

      // dao
      evidence: '10000000', // fixme
      org: '10000000',
      exchange: '10000000'
    }
  }
}
