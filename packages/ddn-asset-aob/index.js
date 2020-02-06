const Issuer = require('./lib/issuer').default;
const Asset = require('./lib/asset').default;
const Flags = require('./lib/flags').default;
const Acl = require('./lib/acl').default;
const Issue = require('./lib/issue').default;
const Transfer = require('./lib/transfer').default;

module.exports = {
  AobIssuer: Issuer, // type: 60
  AobAsset: Asset, // type: 61
  AobFlags: Flags,  // type: 62
  AobAcl: Acl,  //type: 63
  AobIssue: Issue, // type: 64
  AobTransfer: Transfer, // type: 65
};
