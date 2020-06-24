import Issuer from './issuer'
import Asset from './asset'
import Flags from './flags'
import Acl from './acl'
import Issue from './issue'
import Transfer from './transfer'

export default {
  AobIssuer: Issuer, // type: 60
  AobAsset: Asset, // type: 61
  AobFlags: Flags, // type: 62
  AobAcl: Acl, // type: 63
  AobIssue: Issue, // type: 64
  AobTransfer: Transfer // type: 65
}
