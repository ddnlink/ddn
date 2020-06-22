/* ---------------------------------------------------------------------------------------------
 *  Created by imfly on Wed Mar 14 2017 16:21:58
 *
 *  Copyright (c) 2017 DDN.link. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *
 *  All transaction-types.js -> @ddn/utils/asset-types.js
 *-------------------------------------------------------------------------------------------- */

export default {
  // base 0-19
  TRANSFER: 0, // TRANSFER note: .SEND -> .TRANSFER
  SIGNATURE: 1, // SETUP SECOND_PASSWORD
  DELEGATE: 2, // DELEGATE
  VOTE: 3, // VOTE FOR DELEGATE
  MULTISIGNATURE: 4, // MULTISIGNATURE note: .MULTI -> .MULTISIGNATURE
  DAPP: 5, // DAPP REGISTER
  DAPP_IN: 6, // DAPP DEPOSIT
  DAPP_OUT: 7, // DAPP WITHDRAW

  MULTITRANSFER: 8, // 废弃
  USERINFO: 9,

  // Evidence: 20-39,
  EVIDENCE: 20,

  // DAO 40-59
  DAO_ORG: 40,
  DAO_EXCHANGE: 41,
  DAO_CONTRIBUTION: 42,
  DAO_CONFIRMATION: 43,

  // Coupon
  COUPON_ISSUER_AUDITOR_BUY: 49,
  COUPON_ISSUER_APPLY: 50,
  COUPON_ISSUER_CHECK: 51,
  COUPON_ISSUER_UPDATE: 52,
  COUPON_ISSUER_FREEZE: 53,
  COUPON_ISSUER_UNFREEZE: 54,
  COUPON_ISSUE_NEW: 55,
  COUPON_ISSUE_CLOSE: 56,
  COUPON_ISSUE_REOPEN: 57,
  COUPON_EXCH_BUY: 58,
  COUPON_EXCH_PAY: 59,
  COUPON_EXCH_TRANSFER_ASK: 71,
  COUPON_EXCH_TRANSFER_CONFIRM: 72,

  // AOB-ASSET ON BLOCKCHAIN: 60-79
  AOB_ISSUER: 60, // AOB ISSUER REGISTER
  AOB_ASSET: 61, // AOB ASSET REGISTER
  AOB_FLAG: 62, // AOB FLAGS UPDATE
  AOB_ACL: 63, // AOB ACL UPDATE
  AOB_ISSUE: 64, // AOB ISSUE
  AOB_TRANSFER: 65, // AOB TRANSFER

  LOCK: 100 // ACCOUNT LOCK
}
