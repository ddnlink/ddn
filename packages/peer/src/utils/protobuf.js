/* ---------------------------------------------------------------------------------------------
 *  Created by DDN Team on Wed Mar 14 2017 16:10:18
 *
 *  Copyright (c) 2019 DDN Foundation. All rights reserved.
 *  Licensed under the AGPL 3.0 License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */
import protobuf from 'protobufjs'

import extend from 'extend'
import DdnUtils from '@ddn/utils'
import Asset from '@ddn/asset-base'

class Protobuf {
  constructor (root) {
    this.root = root
  }

  encodeBlock (block) {
    try {
      const obj = extend(true, {}, block)
      obj.payload_hash = Buffer.from(obj.payload_hash, 'hex') // wxm block database
      obj.generator_public_key = Buffer.from(obj.generator_public_key, 'hex') // wxm block database
      if (obj.block_signature) {
        // wxm block database
        obj.block_signature = Buffer.from(obj.block_signature, 'hex') // wxm block database
      }

      // 处理交易
      for (let i = 0; i < obj.transactions.length; ++i) {
        // 确保 args 字段是字符串
        if (obj.transactions[i].args && Array.isArray(obj.transactions[i].args)) {
          obj.transactions[i].args = JSON.stringify(obj.transactions[i].args);
        }

        this.transactionStringToBytes(obj.transactions[i])
      }

      // Note: 当顶级Namespace为空的时候，下面的调用等同于 this.root.lookup('Block').encode(obj).finish()
      return this.root.Block.encode(obj).finish()
    } catch (err) {
      console.error(`Failed to encode block: ${err.message}`);
      throw err;
    }
  }

  decodeBlock (data) {
    try {
      const obj = this.root.Block.decode(data)

      // obj = toNumber(obj);

      obj.payload_hash = obj.payload_hash.toString('hex') // wxm block database
      obj.generator_public_key = obj.generator_public_key.toString('hex') // wxm block database
      if (obj.block_signature) {
        // wxm block database
        obj.block_signature = obj.block_signature.toString('hex') // wxm block database
      }

      // 处理交易
      for (let i = 0; i < obj.transactions.length; ++i) {
        this.transactionBytesToString(obj.transactions[i])

        // 尝试将 args 字段从字符串转换回数组
        if (obj.transactions[i].args && typeof obj.transactions[i].args === 'string') {
          try {
            // 检查是否是JSON数组
            if (obj.transactions[i].args.startsWith('[') && obj.transactions[i].args.endsWith(']')) {
              obj.transactions[i].args = JSON.parse(obj.transactions[i].args)
            }
          } catch (err) {
            // 如果解析失败，保持原样
            console.error(`Failed to parse args as JSON in transaction ${obj.transactions[i].id}: ${err.message}`)
          }
        }
      }

      return obj
    } catch (err) {
      console.error(`Failed to decode block: ${err.message}`);
      throw err;
    }
  }

  encodeBlockPropose (propose) {
    const obj = extend(true, {}, propose)
    obj.generator_public_key = Buffer.from(obj.generator_public_key, 'hex') // wxm block database
    obj.hash = Buffer.from(obj.hash, 'hex')
    obj.signature = Buffer.from(obj.signature, 'hex')
    const err = this.root.BlockPropose.verify(obj)
    if (err) {
      throw Error(err)
    }
    return this.root.BlockPropose.encode(obj).finish()
  }

  decodeBlockPropose (data) {
    const obj = this.root.BlockPropose.decode(data)
    obj.generator_public_key = obj.generator_public_key.toString('hex') // wxm block database
    obj.hash = obj.hash.toString('hex')
    obj.signature = obj.signature.toString('hex')
    return obj
  }

  encodeBlockVotes (obj) {
    try {
      // 确保 obj 是有效的对象
      if (!obj || typeof obj !== 'object') {
        throw new Error('Invalid block votes object');
      }

      // 确保 signatures 是数组
      if (!Array.isArray(obj.signatures)) {
        obj.signatures = [];
      }

      // 创建一个新的 signatures 数组，只包含有效的签名
      const validSignatures = [];

      for (let i = 0; i < obj.signatures.length; i++) {
        const signature = obj.signatures[i];

        // 检查签名是否有效
        if (signature && typeof signature === 'object' &&
            typeof signature.key === 'string' &&
            typeof signature.sig === 'string') {
          try {
            // 创建一个新的签名对象，避免修改原始对象
            validSignatures.push({
              key: Buffer.from(signature.key, 'hex'),
              sig: Buffer.from(signature.sig, 'hex')
            });
          } catch (err) {
            console.error(`Failed to convert signature at index ${i} to buffer: ${err.message}`);
            // 跳过无效的签名
          }
        }
      }

      // 替换原始签名数组
      obj.signatures = validSignatures;

      const err = this.root.BlockVotes.verify(obj);
      if (err) {
        throw Error(err);
      }

      return this.root.BlockVotes.encode(obj).finish();
    } catch (err) {
      console.error(`Failed to encode block votes: ${err.message}`);
      // 返回一个有效的但空的 BlockVotes 对象
      const emptyVotes = {
        height: obj.height || '0',
        id: obj.id || '',
        signatures: []
      };
      return this.root.BlockVotes.encode(emptyVotes).finish();
    }
  }

  decodeBlockVotes (data) {
    const obj = this.root.BlockVotes.decode(data)

    for (const signature of obj.signatures) {
      signature.key = signature.key.toString('hex')
      signature.sig = signature.sig.toString('hex')
    }

    return obj
  }

  encodeTransaction (trs) {
    const obj = extend(true, {}, trs)

    // 确保 args 字段是字符串
    if (obj.args && Array.isArray(obj.args)) {
      obj.args = JSON.stringify(obj.args)
    }

    this.transactionStringToBytes(obj)

    const err = this.root.Transaction.verify(obj)
    if (err) {
      throw Error(err)
    }

    return this.root.Transaction.encode(obj).finish()
  }

  decodeTransaction (data) {
    const obj = this.root.Transaction.decode(data).toJSON()
    this.transactionBytesToString(obj)

    // 尝试将 args 字段从字符串转换回数组
    if (obj.args && typeof obj.args === 'string') {
      try {
        // 检查是否是JSON数组
        if (obj.args.startsWith('[') && obj.args.endsWith(']')) {
          obj.args = JSON.parse(obj.args)
        }
      } catch (err) {
        // 如果解析失败，保持原样
        console.error(`Failed to parse args as JSON: ${err.message}`)
      }
    }

    return obj
  }

  transactionStringToBytes (obj) {
    try {
      // 确保 args 字段是字符串
      if (obj.args && Array.isArray(obj.args)) {
        obj.args = JSON.stringify(obj.args);
      }

      obj.senderPublicKey = Buffer.from(obj.senderPublicKey, 'hex') // wxm block database
      obj.signature = Buffer.from(obj.signature, 'hex')
      if (obj.requester_public_key) {
        // wxm block database
        obj.requester_public_key = Buffer.from(obj.requester_public_key, 'hex') // wxm block database
      }
      if (obj.sign_signature) {
        // wxm block database
        obj.sign_signature = Buffer.from(obj.sign_signature, 'hex') // wxm block database
      }

      switch (obj.type) {
        case DdnUtils.assetTypes.DELEGATE:
          if (obj.asset.delegate) {
            obj.asset.delegate.publicKey = Buffer.from(obj.asset.delegate.publicKey, 'hex') // wxm block database
          }
          break
        case DdnUtils.assetTypes.SIGNATURE:
          if (obj.asset.signature) {
            obj.asset.signature.publicKey = Buffer.from(obj.asset.signature.publicKey, 'hex') // wxm block database
          }
          break
      }
    } catch (err) {
      console.error(`Failed to convert transaction string to bytes: ${err.message}`);
      throw err;
    }
  }

  transactionBytesToString (obj) {
    try {
      obj.senderPublicKey = Buffer.from(obj.senderPublicKey, 'base64').toString('hex') // obj.senderPublicKey.toString('hex');  //wxm block database
      obj.signature = Buffer.from(obj.signature, 'base64').toString('hex') // obj.signature.toString('hex');
      if (obj.requester_public_key) {
        // wxm block database
        obj.requester_public_key = Buffer.from(obj.requester_public_key, 'base64').toString('hex') // obj.requester_public_key.toString('hex');  //wxm block database
      }
      if (obj.sign_signature) {
        // wxm block database
        obj.sign_signature = Buffer.from(obj.sign_signature, 'base64').toString('hex') // obj.sign_signature.toString('hex');    //wxm block database
      }

      // 尝试将 args 字段从字符串转换回数组
      if (obj.args && typeof obj.args === 'string') {
        try {
          // 检查是否是JSON数组
          if (obj.args.startsWith('[') && obj.args.endsWith(']')) {
            obj.args = JSON.parse(obj.args)
          }
        } catch (err) {
          // 如果解析失败，保持原样
          console.error(`Failed to parse args as JSON: ${err.message}`)
        }
      }

      switch (obj.type) {
        case DdnUtils.assetTypes.DELEGATE:
          if (obj.asset.delegate) {
            obj.asset.delegate.publicKey = Buffer.from(obj.asset.delegate.publicKey, 'base64').toString('hex') // obj.asset.delegate.publicKey.toString('hex');  //wxm block database
          }
          break
        case DdnUtils.assetTypes.SIGNATURE:
          if (obj.asset.signature) {
            obj.asset.signature.publicKey = Buffer.from(obj.asset.signature.publicKey, 'base64').toString('hex') // obj.asset.signature.publicKey.toString('hex');    //wxm block database
          }
          break
      }
    } catch (err) {
      console.error(`Failed to convert transaction bytes to string: ${err.message}`);
      // 不抛出错误，尽量保持原始对象
    }
  }
}

export default (schemaFile, context, cb) => {
  const insertAssetMessage = async root => {
    const rootTemp = JSON.parse(JSON.stringify(root))

    let maxAssetId = 0
    if (rootTemp.nested.Asset && rootTemp.nested.Asset.fields) {
      for (const p in rootTemp.nested.Asset.fields) {
        maxAssetId = Math.max(maxAssetId, rootTemp.nested.Asset.fields[p].id)
      }
    }

    const transCount = Asset.Utils.getTransactionCount()
    for (let i = 0; i < transCount; i++) {
      const assetTrans = Asset.Utils.getTransactionByIndex(i)

      if (assetTrans) {
        const assetJsonName = Asset.Utils.getAssetJsonName(assetTrans.type)
        // 获取交易类，兼容ESM和CommonJS
        const TransModule = global._require_runtime_(assetTrans.package)
        const TransCls = TransModule[assetTrans.name] || TransModule.default[assetTrans.name]

        if (!TransCls || typeof TransCls !== 'function') {
          console.error(`无法找到交易类: ${assetTrans.package}.${assetTrans.name}`)
          continue; // 跳过这个资产类型
        }

        const transInst = new TransCls(context) // wxm 此处传的都是null，必须保证propsMapping里不要用到这传入的context参数
        const props = await transInst.propsMapping()
        const fields = {}

        props.forEach((pItem, j) => {
          fields[pItem.prop] = {}

          if (pItem.required) {
            fields[pItem.prop].rule = 'required'
          }

          let fieldType = pItem.field.replace(/[0-9]/g, '')
          fieldType = fieldType.replace(/_ext$/, '')
          if (fieldType === 'int') {
            fields[pItem.prop].type = 'int32'
          } else {
            fields[pItem.prop].type = 'string'
          }

          fields[pItem.prop].id = j + 1
        })

        rootTemp.nested.Asset.oneofs.derivedAsset.oneof.push(assetJsonName)
        rootTemp.nested.Asset.fields[assetJsonName] = {
          type: assetTrans.name,
          id: maxAssetId + 1
        }
        rootTemp.nested[assetTrans.name] = {
          fields
        }

        maxAssetId++
      }
    }

    return protobuf.Root.fromJSON(rootTemp)
  }

  // wxm block database
  protobuf.parse.defaults.keepCase = true

  protobuf.load(schemaFile, async (err, root) => {
    if (err) {
      return cb(`Failed to read proto file: ${err}`)
    }

    // fs.writeFileSync('./protobuf_root1.json', JSON.stringify(root))
    // fixme: 2020.6.25 下面的方法将 evidence 重复添加了 2 次
    root = await insertAssetMessage(root)

    // fs.writeFileSync('./protobuf_root2.json', JSON.stringify(root))

    cb(null, new Protobuf(root))
  })
}
