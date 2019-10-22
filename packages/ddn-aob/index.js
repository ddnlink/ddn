const Issuer = require('./lib/issuer');
const Asset = require('./lib/asset');
const Flags = require('./lib/flags');
const Acl = require('./lib/acl');
const Issue = require('./lib/issue');
const Transfer = require('./lib/transfer');

module.exports = {
  AobIssuer: Issuer, // type: 60
  AobAsset: Asset, // type: 61
  AobFlags: Flags,  // type: 62
  AobAcl: Acl,  //type: 63
  AobIssue: Issue, // type: 64
  AobTransfer: Transfer, // type: 65
};
