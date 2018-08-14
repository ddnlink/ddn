/*---------------------------------------------------------------------------------------------
 *  Created by imfly on Wed Mar 14 2017 16:21:58
 *
 *  Copyright (c) 2017 DDN.link. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

module.exports = {
  // base 0-19
  SEND: 0, // TRANSFER
  SIGNATURE: 1, // SETUP SECOND_PASSWORD
  DELEGATE: 2, // SECOND_PASSWORD
  VOTE: 3, // VOTE FOR DELEGATE
  MULTI: 4, // MULTISIGNATURE
  DAPP: 5, // DAPP REGISTER
  IN_TRANSFER: 6, // DAPP DEPOSIT
  OUT_TRANSFER: 7, // DAPP WITHDRAW

  MULTITRANSFER: 8,
  USERINFO: 9,

  // Evidence: 20-39, 
  EVIDENCE: 20,
  
  // DAO 40-59
  ORG: 40,
  EXCHANGE: 41,
  CONTRIBUTION: 42,
  CONFIRMATION: 43,

  //Coupon 
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
  AOB_FLAGS: 62, // AOB FLAGS UPDATE
  AOB_ACL: 63, // AOB ACL UPDATE
  AOB_ISSUE: 64, // AOB ISSUE
  AOB_TRANSFER: 65, // AOB TRANSFER

  LOCK: 100 // ACCOUNT LOCK
}
