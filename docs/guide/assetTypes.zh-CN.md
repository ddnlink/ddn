---
title: 交易类型 # 课程标题
challengeType: 0               # 课程类型，默认为0：理论， 1： 实验
order: 1                       # 序号，以此为当前单元的课程排序
time:  5个小时                  # 学习时长
videoUrl: ''                   # 视频链接地址
prjectUrl: 'https://github.com/' # 源码地址
localeTitle: DDN交易类型       # 本地化标题
---

# 交易类型

交易类型是标明链上交易方式的标识符，由0~100数字表示，不能重复。DDN 区块链目前支持多种交易类型，列表如下：

```js
  // base 0-19
  TRANSFER: 0, // TRANSFER .TRANSFER
  SIGNATURE: 1, // 设置二级密码 SETUP SECOND_PASSWORD
  DELEGATE: 2, // DELEGATE
  VOTE: 3, // 代表投票 VOTE FOR DELEGATE
  MULTISIGNATURE: 4, // 多重签名 MULTISIGNATURE note: .MULTI -> .MULTISIGNATURE
  DAPP: 5, // DAPP注册 DAPP REGISTER
  DAPP_IN: 6, // DAPP DEPOSIT
  DAPP_OUT: 7, // DAPP WITHDRAW

  MULTITRANSFER: 8,
  USERINFO: 9,

  // 存证 Evidence: 20-39,
  EVIDENCE: 20,

  // 组织 DAO 40-59
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

  // 链上资产 AOB-ASSET ON BLOCKCHAIN: 60-79
  AOB_ISSUER: 60, // 链上资产注册商 AOB ISSUER REGISTER
  AOB_ASSET: 61, // 链上资产 AOB ASSET REGISTER
  AOB_FLAG: 62, // AOB FLAGS UPDATE
  AOB_ACL: 63, // AOB ACL UPDATE
  AOB_ISSUE: 64, // 链上资产发行 AOB ISSUE
  AOB_TRANSFER: 65, // 链上资产转账 AOB TRANSFER

  LOCK: 100 // 钱包锁定 ACCOUNT LOCK
```
