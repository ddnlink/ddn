import * as crypto from './crypto'
import transfer from './transactions/transfer'
import delegate from './transactions/delegate'
import signature from './transactions/signature'
import transaction from './transactions/transaction'
import vote from './transactions/vote'
import contract from './transactions/contract'
import username from './transactions/username'
import multisignature from './transactions/multisignature'
import dapp from './transactions/dapp'
import aob from './transactions/aob'
import evidence from './transactions/evidence'
import dao from './transactions/dao'
import exchange from './transactions/exchange'
import coupon from './transactions/coupon'
import assetPlugin from './transactions/asset-plugin'
import * as utils from './utils'
import { init, setup } from './config'

export default {
  init,
  setup, // 为了向后兼容保留
  // utils
  utils,
  crypto,

  // base
  transfer,
  delegate,
  signature,
  transaction,
  vote,
  contract,
  username,
  multisignature,

  // dapp
  dapp,

  // aob
  aob,

  // dao
  evidence,
  dao,
  exchange,

  // coupon
  coupon,

  assetPlugin
}
