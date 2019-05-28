const Issuer = require('./lib/issuer');
const Asset = require('./lib/asset');
const Issue = require('./lib/issue');
const Transfer = require('./lib/transfer');

module.exports = {
  AobIssuer: Issuer, // type: 75 60
  AobAsset: Asset, // type: 76 61
  AobIssue: Issue, // type: 77 64
  AobTransfer: Transfer, // type: 78 65
  // AobAcl: require('./lib/acl'), // type: 79
  // AobFlag: require('./lib/flags'), // type: 80
  // AobFlagHelper: require('./lib/flagsHelper'), // type: 81
  // AobHelper: require('./lib/Helper'), // type: 81
};
