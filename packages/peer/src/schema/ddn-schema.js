/* ---------------------------------------------------------------------------------------------
 *  Created by wangxm on Mon Mar 13 2019 8:52:48
 *
 *  Copyright (c) 2019 DDN.link. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

/**
 * DDN Schema
 */
import Ajv from 'ajv'

import path from 'path'
import fs from 'fs'

let _singleton

class DdnSchema {
  static singleton () {
    if (!_singleton) {
      _singleton = new DdnSchema()
    }
    return _singleton
  }

  constructor () {
    this._ajv = new Ajv({ schemaId: 'auto', allErrors: true })

    this._attachFormatExt('format-ext')
  }

  /**
   * 将自定义的验证格式加载进来，格式如下：
   * export default {
   *       // 名称必须有，验证逻辑中使用
   *       name: "ip",
   *
   *       // 具体的验证方法
   *       validate(value) {
   *           return true;
   *       }
   *   };
   *
   * @param {string} dir 与本文件同级的路径名
   */
  _attachFormatExt (dir) {
    const extPath = path.resolve(__dirname, dir)

    const items = fs.readdirSync(extPath)
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const itemPath = path.resolve(extPath, item)
      const itemInfo = fs.statSync(itemPath)
      if (itemInfo.isFile()) {
        const pos = item.lastIndexOf('.')
        if (pos >= 0) {
          const ext = item.substring(pos)
          // TODO: 2020.4.23 这里写死了只能是 `.js` 文件, 因为下面使用的`require`方法。如果编译使用，源文件可以是其他格式，注意优化调整
          if (ext.toLowerCase() === '.js') {
            const extFormat = global._require_runtime_(itemPath)
            if (extFormat !== null && typeof extFormat.name === 'string' && typeof extFormat.validate === 'function') {
              this._ajv.addFormat(extFormat.name, extFormat.validate)
            }
          }
        }
      }
    }
  }

  async validateBlock (block) {
    const schemaFile = path.resolve(__dirname, './ddn-schemas/block')
    const blockSchema = global._require_runtime_(schemaFile)
    return await this.validate(blockSchema, block)
  }

  async validateTransaction (trs) {
    const schemaFile = path.resolve(__dirname, './ddn-schemas/transaction')
    const transactionSchema = global._require_runtime_(schemaFile)
    return await this.validate(transactionSchema, trs)
  }

  async validatePeer (peer) {
    const schemaFile = path.resolve(__dirname, './ddn-schemas/peer')
    const peerSchema = global._require_runtime_(schemaFile)
    return await this.validate(peerSchema, peer)
  }

  async validatePeers (peer) {
    const schemaFile = path.resolve(__dirname, './ddn-schemas/peers')
    const peerSchema = global._require_runtime_(schemaFile)
    return await this.validate(peerSchema, peer)
  }

  async validateEvidence (evidence) {
    const schemaFile = path.resolve(__dirname, './ddn-schemas/evidence')
    const peerSchema = global._require_runtime_(schemaFile)
    return await this.validate(peerSchema, evidence)
  }

  async validateDapp (dapp) {
    const schemaFile = path.resolve(__dirname, './ddn-schemas/dapp')
    const peerSchema = global._require_runtime_(schemaFile)
    return await this.validate(peerSchema, dapp)
  }

  async validateDappInTransfer (intransfer) {
    const schemaFile = path.resolve(__dirname, './ddn-schemas/dapp-in-transfer')
    const peerSchema = global._require_runtime_(schemaFile)
    return await this.validate(peerSchema, intransfer)
  }

  async validateDappOutTransfer (outtransfer) {
    const schemaFile = path.resolve(__dirname, './ddn-schemas/dapp-out-transfer')
    const peerSchema = global._require_runtime_(schemaFile)
    return await this.validate(peerSchema, outtransfer)
  }

  /** aob资产的验证规则 */

  async validateAobAcl (acl) {
    const schemaFile = path.resolve(__dirname, './ddn-schemas/aob/acl')
    const peerSchema = global._require_runtime_(schemaFile)
    return await this.validate(peerSchema, acl)
  }

  async validateAobAsset (asset) {
    const schemaFile = path.resolve(__dirname, './ddn-schemas/aob/asset')
    const peerSchema = global._require_runtime_(schemaFile)
    return await this.validate(peerSchema, asset)
  }

  async validateAobflag (flag) {
    const schemaFile = path.resolve(__dirname, './ddn-schemas/aob/flag')
    const peerSchema = global._require_runtime_(schemaFile)
    return await this.validate(peerSchema, flag)
  }

  async validateAobIssue (issue) {
    const schemaFile = path.resolve(__dirname, './ddn-schemas/aob/issue')
    const peerSchema = global._require_runtime_(schemaFile)
    return await this.validate(peerSchema, issue)
  }

  async validateAobIssuer (issuer) {
    const schemaFile = path.resolve(__dirname, './ddn-schemas/aob/issuer')
    const peerSchema = global._require_runtime_(schemaFile)
    return await this.validate(peerSchema, issuer)
  }

  async validateAobTransfer (transfer) {
    const schemaFile = path.resolve(__dirname, './ddn-schemas/aob/transfer')
    const peerSchema = global._require_runtime_(schemaFile)
    return await this.validate(peerSchema, transfer)
  }

  // 验证dao

  async validateDaoContribution (contribution) {
    const schemaFile = path.resolve(__dirname, './ddn-schemas/dao/contribution')
    const peerSchema = global._require_runtime_(schemaFile)
    return await this.validate(peerSchema, contribution)
  }

  async validateDaoConfirmation (confirmation) {
    const schemaFile = path.resolve(__dirname, './ddn-schemas/dao/confirmation')
    const peerSchema = global._require_runtime_(schemaFile)
    return await this.validate(peerSchema, confirmation)
  }

  async validateDaoExchange (exchange) {
    const schemaFile = path.resolve(__dirname, './ddn-schemas/dao/exchange')
    const peerSchema = global._require_runtime_(schemaFile)
    return await this.validate(peerSchema, exchange)
  }

  async validateDaoOrg (org) {
    const schemaFile = path.resolve(__dirname, './ddn-schemas/dao/org')
    const peerSchema = global._require_runtime_(schemaFile)
    return await this.validate(peerSchema, org)
  }

  /**
   * 根据schema格式校验data数据是否合法，合法返回null，否则返回错误对象
   * @param {*} schema
   * @param {*} data
   */
  async validate (schema, data) {
    const result = this._ajv.validate(schema, data)
    if (!result) {
      return this._ajv.errors
    }
    return null
  }
}

export default DdnSchema
