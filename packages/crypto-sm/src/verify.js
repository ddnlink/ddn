/* ---------------------------------------------------------------------------------------------
 *  Created by Imfly on Wed Jan 29 2020 11:48:54
 *
 *  Copyright (c) 2019 DDN FOUNDATION. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

import { getBytes } from './bytes'
import { verifyBytes } from './sm'

// 验证签名
// todo: 本方法并没有被实际使用，请参考 peer/kernal/transaction/transaction.js的 verifySignature 重构
async function verify (transaction, senderPublicKey) {
  if (!transaction.signature) {
    return false
  }

  if (!senderPublicKey) {
    senderPublicKey = transaction.senderPublicKey
  }

  const bytes = await getBytes(transaction, true, true)
  return verifyBytes(bytes, transaction.signature, senderPublicKey)
}

/**
 * 二次签名验证 TODO：没有使用，重构或删除 2020.12.7
 * @param {object} transaction 交易数据
 * @param {string} publicKey 二次签名公钥
 */
async function verifySecondSignature (transaction, publicKey) {
  if (!transaction.sign_signature) {
    return false
  }
  const bytes = await getBytes(transaction, false, true)
  return verifyBytes(bytes, transaction.sign_signature, publicKey)
}

export {
  // 验证： 前端验证，底层也会验证
  verify,
  verifySecondSignature
}
