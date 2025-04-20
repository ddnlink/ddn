---
order: 12
id: feature-management-example
title: DDN区块链特性管理配置示例
sidebar_label: 特性管理配置示例
---

# DDN区块链特性管理配置示例

本文档提供了DDN区块链特性管理系统的配置示例，帮助开发者理解如何配置和使用特性管理系统。

## 1. 特性配置文件示例

以下是一个完整的特性配置文件示例，展示了如何配置多个特性及其激活条件：

```javascript
/**
 * 特性配置文件 - 定义区块链支持的所有特性及其激活条件
 */

import { multisigWeightsMigration } from '../db/migrations/multisig-weights'
import { transactionExpirationMigration } from '../db/migrations/transaction-expiration'
import { batchSignatureMigration } from '../db/migrations/batch-signature'
import { signatureRevocationMigration } from '../db/migrations/signature-revocation'

// 网络类型常量
const NETWORK_TYPES = {
  MAINNET: 'mainnet',
  TESTNET: 'testnet',
  LOCALNET: 'localnet'
}

// 根据网络类型获取特性配置
export function getFeatureConfigs(netType) {
  // 基础配置，适用于所有网络
  const baseConfigs = {
    // 多重签名权重系统
    'multisig_weights': {
      version: 1,
      description: '为多重签名添加权重系统，使签名机制更灵活',
      migrationHandler: multisigWeightsMigration,
      dependencies: []
    },
    
    // 签名撤销功能
    'signature_revocation': {
      version: 1,
      description: '允许用户在交易确认前撤销自己的签名',
      migrationHandler: signatureRevocationMigration,
      dependencies: []
    },
    
    // 交易过期自动处理
    'transaction_expiration': {
      version: 1,
      description: '根据lifetime参数自动清理过期交易',
      migrationHandler: transactionExpirationMigration,
      dependencies: []
    },
    
    // 批量签名接口
    'batch_signature': {
      version: 1,
      description: '允许用户一次对多个交易进行签名',
      migrationHandler: batchSignatureMigration,
      dependencies: []
    },
    
    // 智能合约支持
    'smart_contract': {
      version: 2,
      description: '添加智能合约支持',
      migrationHandler: null, // 暂无迁移
      dependencies: ['multisig_weights'] // 依赖多重签名权重系统
    },
    
    // 资产交换协议
    'asset_exchange': {
      version: 2,
      description: '实现去中心化资产交换协议',
      migrationHandler: null, // 暂无迁移
      dependencies: ['smart_contract'] // 依赖智能合约
    }
  }
  
  // 根据网络类型设置不同的激活条件
  switch (netType) {
    case NETWORK_TYPES.MAINNET:
      // 主网激活高度设置较高，给节点运营者足够的更新时间
      return {
        'multisig_weights': {
          ...baseConfigs.multisig_weights,
          activationHeight: 10000000, // 设置一个未来的区块高度
          required: false
        },
        'signature_revocation': {
          ...baseConfigs.signature_revocation,
          activationHeight: 10000000
        },
        'transaction_expiration': {
          ...baseConfigs.transaction_expiration,
          activationHeight: 10000000
        },
        'batch_signature': {
          ...baseConfigs.batch_signature,
          activationHeight: 10000000
        },
        'smart_contract': {
          ...baseConfigs.smart_contract,
          activationHeight: 12000000 // 更高的激活高度
        },
        'asset_exchange': {
          ...baseConfigs.asset_exchange,
          activationHeight: 12000000
        }
      }
      
    case NETWORK_TYPES.TESTNET:
      // 测试网激活高度设置较低，便于测试
      return {
        'multisig_weights': {
          ...baseConfigs.multisig_weights,
          activationHeight: 100000, // 测试网较早激活
          required: false
        },
        'signature_revocation': {
          ...baseConfigs.signature_revocation,
          activationHeight: 100000
        },
        'transaction_expiration': {
          ...baseConfigs.transaction_expiration,
          activationHeight: 100000
        },
        'batch_signature': {
          ...baseConfigs.batch_signature,
          activationHeight: 100000
        },
        'smart_contract': {
          ...baseConfigs.smart_contract,
          activationHeight: 150000 // 稍后激活
        },
        'asset_exchange': {
          ...baseConfigs.asset_exchange,
          activationHeight: 150000
        }
      }
      
    case NETWORK_TYPES.LOCALNET:
    default:
      // 本地网络立即激活所有特性，便于开发
      return {
        'multisig_weights': {
          ...baseConfigs.multisig_weights,
          activationHeight: 1,
          required: false
        },
        'signature_revocation': {
          ...baseConfigs.signature_revocation,
          activationHeight: 1
        },
        'transaction_expiration': {
          ...baseConfigs.transaction_expiration,
          activationHeight: 1
        },
        'batch_signature': {
          ...baseConfigs.batch_signature,
          activationHeight: 1
        },
        'smart_contract': {
          ...baseConfigs.smart_contract,
          activationHeight: 1
        },
        'asset_exchange': {
          ...baseConfigs.asset_exchange,
          activationHeight: 1
        }
      }
  }
}
```

## 2. 数据迁移示例

以下是一个数据迁移脚本示例，展示了如何为多重签名权重系统添加数据库字段并设置默认值：

```javascript
/**
 * 多重签名权重迁移脚本
 */

import { System } from '../../utils/system'

export async function multisigWeightsMigration(dao, dbTrans) {
  try {
    // 1. 检查multisignature表是否存在weights字段
    const hasWeightsColumn = await dao.columnExists('multisignature', 'weights')
    
    // 如果字段不存在，添加字段
    if (!hasWeightsColumn) {
      await dao.addColumn('multisignature', 'weights', {
        type: 'TEXT',
        allowNull: true
      }, { transaction: dbTrans })
      
      console.log('Added weights column to multisignature table')
    }
    
    // 2. 检查mem_account表是否存在multiweights和u_multiweights字段
    const hasMultiweightsColumn = await dao.columnExists('mem_account', 'multiweights')
    const hasUMultiweightsColumn = await dao.columnExists('mem_account', 'u_multiweights')
    
    // 如果字段不存在，添加字段
    if (!hasMultiweightsColumn) {
      await dao.addColumn('mem_account', 'multiweights', {
        type: 'TEXT',
        allowNull: true
      }, { transaction: dbTrans })
      
      console.log('Added multiweights column to mem_account table')
    }
    
    if (!hasUMultiweightsColumn) {
      await dao.addColumn('mem_account', 'u_multiweights', {
        type: 'TEXT',
        allowNull: true
      }, { transaction: dbTrans })
      
      console.log('Added u_multiweights column to mem_account table')
    }
    
    // 3. 为现有的多重签名记录设置默认权重
    const multisigs = await dao.findList('multisignature', {
      where: {
        weights: null
      },
      transaction: dbTrans
    })
    
    console.log(`Found ${multisigs.length} multisignature records without weights`)
    
    for (const ms of multisigs) {
      // 计算keysgroup中的签名者数量
      const keysCount = ms.keysgroup.split(',').length
      
      // 创建默认权重数组（每个签名者权重为1）
      const defaultWeights = Array(keysCount).fill(1).join(',')
      
      // 更新记录
      await dao.update('multisignature', {
        weights: defaultWeights
      }, {
        where: {
          transaction_id: ms.transaction_id
        },
        transaction: dbTrans
      })
    }
    
    console.log(`Updated ${multisigs.length} multisignature records with default weights`)
    
    // 4. 为现有的账户设置默认权重
    const accounts = await dao.findList('mem_account', {
      where: {
        multisignatures: {
          $ne: null
        },
        multiweights: null
      },
      transaction: dbTrans
    })
    
    console.log(`Found ${accounts.length} accounts with multisignatures but without weights`)
    
    for (const acc of accounts) {
      if (acc.multisignatures) {
        // 计算multisignatures中的签名者数量
        const keysCount = acc.multisignatures.split(',').length
        
        // 创建默认权重数组
        const defaultWeights = Array(keysCount).fill(1).join(',')
        
        // 更新账户记录
        await dao.update('mem_account', {
          multiweights: defaultWeights
        }, {
          where: {
            address: acc.address
          },
          transaction: dbTrans
        })
      }
    }
    
    console.log(`Updated ${accounts.length} accounts with default weights`)
    
    console.log('Multisignature weights migration completed successfully')
  } catch (err) {
    console.error(`Multisignature weights migration failed: ${System.getErrorMsg(err)}`)
    throw err
  }
}
```

## 3. 特性检查使用示例

以下是在代码中使用特性检查的示例，展示了如何条件性地执行新功能：

### 3.1 简单条件检查

```javascript
// 检查特性是否激活
if (this.runtime.featureChecker.isFeatureActive('multisig_weights')) {
  // 多重签名权重特性激活时执行的代码
  const weights = transaction.asset.multisignature.weights;
  // 使用权重进行验证...
} else {
  // 多重签名权重特性未激活时执行的代码
  // 使用传统方式验证...
}
```

### 3.2 使用withFeature方法

```javascript
// 使用withFeature方法条件性执行代码
this.runtime.featureChecker.withFeature(
  'transaction_expiration',
  () => {
    // 交易过期特性激活时执行的代码
    const currentTime = slots.getTime();
    const lifetime = transaction.asset.multisignature.lifetime * 3600;
    const expirationTime = transaction.timestamp + lifetime;
    
    if (currentTime > expirationTime) {
      // 交易已过期，执行清理...
    }
  },
  () => {
    // 交易过期特性未激活时执行的代码
    // 不做任何处理...
  }
);
```

### 3.3 使用withFeatureAsync方法

```javascript
// 使用withFeatureAsync方法条件性执行异步代码
await this.runtime.featureChecker.withFeatureAsync(
  'batch_signature',
  async () => {
    // 批量签名特性激活时执行的异步代码
    for (const transactionId of body.transactionIds) {
      // 处理每个交易...
      const transaction = await this.runtime.transaction.getUnconfirmedTransaction(transactionId);
      // 签名处理...
    }
    
    return { success: true, results };
  },
  async () => {
    // 批量签名特性未激活时执行的异步代码
    return {
      success: false,
      error: 'Batch signature feature is not activated yet'
    };
  }
);
```

## 4. API方法示例

以下是一个API方法示例，展示了如何使用特性检查来条件性地处理请求：

```javascript
/**
 * 撤销对交易的签名
 * @param {*} req 请求对象，包含交易ID和用户密钥
 * @returns {Object} 撤销结果
 */
async postRevokeSign(req) {
  // 如果特性未激活，返回错误
  if (!this.runtime.featureChecker.isFeatureActive('signature_revocation')) {
    return {
      success: false,
      error: 'Signature revocation feature is not activated yet'
    };
  }
  
  const body = Object.assign({}, req.body, req.query);
  const validateErrors = await this.ddnSchema.validate(
    {
      type: 'object',
      properties: {
        secret: {
          type: 'string',
          minLength: 1,
          maxLength: 100
        },
        secondSecret: {
          type: 'string',
          minLength: 1,
          maxLength: 100
        },
        publicKey: {
          type: 'string',
          format: 'publicKey'
        },
        transactionId: {
          type: 'string'
        }
      },
      required: ['transactionId', 'secret']
    },
    body
  );
  
  if (validateErrors) {
    return {
      success: false,
      error: `Validation error: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`
    };
  }
  
  // 业务逻辑...
  const transaction = await this.runtime.transaction.getUnconfirmedTransaction(body.transactionId);
  if (!transaction) {
    return {
      success: false,
      error: 'Transaction not found or already confirmed'
    };
  }
  
  // 验证用户是否有权撤销签名...
  
  // 从签名数组中移除用户的签名...
  
  return {
    success: true,
    transactionId: transaction.id
  };
}
```

## 5. 完整示例：多重签名权重系统

以下是实现多重签名权重系统的完整示例，展示了如何使用特性管理系统来安全地升级区块链功能：

### 5.1 特性定义

```javascript
// 在features.js中定义多重签名权重特性
'multisig_weights': {
  version: 1,
  description: '为多重签名添加权重系统，使签名机制更灵活',
  migrationHandler: multisigWeightsMigration,
  dependencies: [],
  activationHeight: 10000000 // 主网激活高度
}
```

### 5.2 数据库迁移

```javascript
// 多重签名权重迁移脚本
export async function multisigWeightsMigration(dao, dbTrans) {
  // 添加weights字段到multisignature表
  // 添加multiweights和u_multiweights字段到mem_account表
  // 为现有记录设置默认权重
}
```

### 5.3 资产定义修改

```javascript
// 修改create方法，使用特性检查
async create(options, trs) {
  trs.recipientId = null;
  trs.amount = '0';
  
  // 使用特性检查来决定是否包含权重
  return this.runtime.featureChecker.withFeature(
    'multisig_weights',
    () => {
      // 特性激活：包含权重
      const { min, keysgroup, lifetime, weights } = options;
      trs.asset.multisignature = {
        min,
        keysgroup,
        lifetime,
        weights: weights || keysgroup.map(() => 1) // 默认每个签名者权重为1
      };
      return trs;
    },
    () => {
      // 特性未激活：不包含权重
      const { min, keysgroup, lifetime } = options;
      trs.asset.multisignature = {
        min,
        keysgroup,
        lifetime
      };
      return trs;
    }
  );
}
```

### 5.4 验证逻辑修改

```javascript
// 修改ready方法，使用特性检查
async ready(trs, sender) {
  // 使用特性检查来决定验证方式
  return this.runtime.featureChecker.withFeatureAsync(
    'multisig_weights',
    async () => {
      // 特性激活：使用权重验证
      return this._readyWithWeights(trs, sender);
    },
    async () => {
      // 特性未激活：使用传统验证
      return this._readyTraditional(trs, sender);
    }
  );
}

// 使用权重的验证逻辑
async _readyWithWeights(trs, sender) {
  // 权重验证逻辑...
}

// 传统的验证逻辑
async _readyTraditional(trs, sender) {
  // 传统验证逻辑...
}
```

### 5.5 API接口修改

```javascript
// 修改put方法，使用特性检查
async put(req) {
  const body = Object.assign({}, req.body, req.query);
  
  // 使用特性检查来决定验证规则
  const validateSchema = this.runtime.featureChecker.isFeatureActive('multisig_weights')
    ? {
        // 包含权重的验证规则
        // ...
      }
    : {
        // 不包含权重的验证规则
        // ...
      };
  
  const validateErrors = await this.ddnSchema.validate(validateSchema, body);
  // ...
}
```

## 6. 总结

通过以上示例，您可以看到DDN区块链特性管理系统如何通过配置驱动的方式来管理功能的激活和升级。这种方法使得开发者可以专注于功能开发，而不需要担心复杂的兼容性问题，同时确保了区块链网络可以平滑升级，保持数据一致性和向后兼容性。

更多详细信息，请参考[特性管理与升级系统](./feature-management-system.md)文档和[特性管理快速入门](./feature-management-quickstart.md)指南。
