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

  MULTITRANSFER: 16, // 待修改
  USERINFO: 17,

  // Evidence: 20-39, 
  EVIDENCE: 20,
  STORAGE: 8, // 删除该类型，及其相关代码
  DOMAIN: 18, // 删除该类型，及其相关代码
  
  // AOB-ASSET ON BLOCKCHAIN: 40-59
  AOB_ISSUER: 9, // AOB ISSUER REGISTER
  AOB_ASSET: 10, // AOB ASSET REGISTER
  AOB_FLAGS: 11, // AOB FLAGS UPDATE
  AOB_ACL: 12, // AOB ACL UPDATE
  AOB_ISSUE: 13, // AOB ISSUE
  AOB_TRANSFER: 14, // AOB TRANSFER

  // DAO 60-79
  ORG: 21,
  EXCHANGE: 22,
  CONTRIBUTION: 23,
  CONFIRMATION: 24,


  LOCK: 100 // ACCOUNT LOCK
}
