/*---------------------------------------------------------------------------------------------
 *  Created by imfly on Wed Mar 14 2017 16:21:58
 *
 *  Copyright (c) 2017 DDN.link. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

module.exports = {
  SEND: 0, // TRANSFER
  SIGNATURE: 1, // SETUP SECOND_PASSWORD
  DELEGATE: 2, // SECOND_PASSWORD
  VOTE: 3, // VOTE FOR DELEGATE
  MULTI: 4, // MULTISIGNATURE
  DAPP: 5, // DAPP REGISTER
  IN_TRANSFER: 6, // DAPP DEPOSIT
  OUT_TRANSFER: 7, // DAPP WITHDRAW

  // todo: 10-19, Evidence
  STORAGE: 8, // UPLOAD STORAGE
  MULTITRANSFER: 16,
  USERINFO: 17,
  DOMAIN: 18,
  EVIDENCE: 20,

  // DAO 21-39
  ORG: 21,
  EXCHANGE: 22,
  CONTRIBUTION: 23,
  CONFIRMATION: 24,

  // todo: 20-39, AOB-ASSET ON BLOCKCHAIN
  AOB_ISSUER: 9, // AOB ISSUER REGISTER
  AOB_ASSET: 10, // AOB ASSET REGISTER
  AOB_FLAGS: 11, // AOB FLAGS UPDATE
  AOB_ACL: 12, // AOB ACL UPDATE
  AOB_ISSUE: 13, // AOB ISSUE
  AOB_TRANSFER: 14, // AOB TRANSFER

  LOCK: 100 // ACCOUNT LOCK
}
