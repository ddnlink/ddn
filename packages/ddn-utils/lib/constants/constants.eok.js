module.exports = {
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
  maxConfirmations : 77 * 100,
  confirmationLength: 77,
  fixedPoint : Math.pow(10, 8),
  totalAmount: "1000000000000000000",
  maxTxsPerBlock: 500,
  tokenName: 'EOK',
  tokenPrefix: 'E',
  foundAddress: 'E8tVcYSSpcBVzPwRyZKZbSCQb43V9TRAdJ',

  walletUrl: 'http://wallet.ebookchain.org',
  testnet: {
    rewardRatio: 0.2,
    milestones: [
      "1000000000", // Initial Reward
      "8000000000", // Milestone 1
      "6000000000", // Milestone 2
      "4000000000", // Milestone 3
      "2000000000"  // Milestone 4
    ],
    beginDate: new Date(Date.UTC(2018, 05, 06, 12, 20, 20, 20)), // testnet
    rewardDistance: 3000000, // Distance between each milestone
    rewardOffset: 1, // Start rewards at block (n)
    compatibleVersion: '0.0.0', // Peer isCompatible?

    // Fees for transacton
    fees: {
      send: "10000000",
      vote: "100000000",
      secondSignature: "500000000",
      delegate: "2500000000",
      multisignature: "500000000",
      dappRegistration: "2500000000",
      dappWithdrawal: "10000000",
      dappDeposit: "10000000",
      data: "10000000"
    },
  },

  mainnet: {
    rewardRatio: 0.2,
    milestones: [
      "1000000000", // Initial Reward
      "8000000000", // Milestone 1
      "6000000000", // Milestone 2
      "4000000000", // Milestone 3
      "2000000000"  // Milestone 4
    ],
    beginDate: new Date(Date.UTC(2018, 06, 31, 4, 0, 0, 0)), // 主网上线：2018年6月31日中午12点（+8)
    rewardDistance: 3000000, // Distance between each milestone
    rewardOffset: 6048, // Start rewards at block (n)
    // If you have some different thing, Please set the compatibleVersion.
    compatibleVersion: '0.0.0', // Peer isCompatible?

    // Fees for transacton
    fees: {
      send: "10000000",
      vote: "100000000",
      secondSignature: "500000000",
      delegate: "2500000000",
      multisignature: "500000000",
      dappRegistration: "2500000000",
      dappWithdrawal: "10000000",
      dappDeposit: "10000000",
      data: "10000000"
    },
  }
}
