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
            if (extFormat !== null &&
                            typeof (extFormat.name) === 'string' &&
                            typeof (extFormat.validate) === 'function') {
              this._ajv.addFormat(extFormat.name, extFormat.validate)
            }
          }
        }
      }
    }
  }

  async validateBlock (block) {
    const schemaFile = path.resolve(__dirname, './ddn-schemas/block.json')
    const blockSchema = global._require_runtime_(schemaFile)
    return await this.validate(blockSchema, block)
  }

  async validateTransaction (trs) {
    const schemaFile = path.resolve(__dirname, './ddn-schemas/transaction.json')
    const transactionSchema = global._require_runtime_(schemaFile)
    return await this.validate(transactionSchema, trs)
  }

  async validatePeer (peer) {
    const schemaFile = path.resolve(__dirname, './ddn-schemas/peer.json')
    const peerSchema = global._require_runtime_(schemaFile)
    return await this.validate(peerSchema, peer)
  }

  async validatePeers (peer) {
    const schemaFile = path.resolve(__dirname, './ddn-schemas/peers.json')
    const peerSchema = global._require_runtime_(schemaFile)
    return await this.validate(peerSchema, peer)
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
