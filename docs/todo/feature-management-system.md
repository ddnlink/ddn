---
order: 10
id: feature-management-system
title: DDN区块链特性管理与升级系统
sidebar_label: 特性管理与升级系统
---

# DDN区块链特性管理与升级系统

## 1. 概述

DDN区块链特性管理与升级系统是一个专为区块链设计的特性开关与版本控制系统，它通过配置驱动的方式管理功能的激活和升级，确保区块链网络可以平滑升级，同时保持数据一致性和向后兼容性。

本文档详细介绍了该系统的设计理念、核心组件、使用方法以及升级流程，帮助开发者安全、简单地实现区块链功能升级。

## 2. 系统特点

### 2.1 配置驱动

- **集中配置**：所有特性及其激活条件都在一个配置文件中管理
- **网络区分**：为主网、测试网和本地网络设置不同的激活条件
- **无硬编码**：避免在代码中硬编码特定的区块高度或版本检查

### 2.2 自动激活

- **基于高度激活**：根据区块高度自动激活特性
- **基于时间激活**：根据时间戳自动激活特性
- **依赖管理**：处理特性之间的依赖关系，确保依赖特性先激活

### 2.3 数据迁移

- **自动迁移**：特性激活时自动执行数据库迁移
- **事务保护**：迁移过程有事务保护，确保数据一致性
- **迁移跟踪**：跟踪已执行的迁移，避免重复执行

### 2.4 向后兼容

- **条件执行**：根据特性激活状态条件性执行代码
- **验证逻辑切换**：自动切换验证逻辑，确保新节点可以验证旧区块
- **默认值处理**：为旧数据提供默认值，确保兼容性

## 3. 系统优势

### 3.1 开发简化

- 开发者可以正常编写代码，不需要考虑复杂的兼容性问题
- 使用简单的API来处理特性检查，降低开发难度
- 新特性可以与现有代码并行开发，不影响现有功能

### 3.2 升级安全

- 特性激活有明确的条件，避免意外激活
- 数据迁移有事务保护，确保数据一致性
- 向后兼容设计确保新节点可以验证旧区块

### 3.3 维护简化

- 代码结构清晰，易于理解和维护
- 避免了代码中充斥着条件判断和特殊处理
- 特性配置集中管理，易于查看和修改

### 3.4 网络稳定

- 平滑升级，不需要停机或重置区块链
- 节点可以逐步更新，不需要所有节点同时更新
- 特性激活有预设条件，给节点运营者足够的更新时间

## 4. 核心组件

### 4.1 特性管理器 (FeatureManager)

特性管理器负责管理所有特性的注册和激活，它提供以下功能：

- 注册特性及其激活条件
- 检查特性是否已激活
- 处理特性之间的依赖关系
- 执行特性相关的数据迁移

```javascript
// 特性管理器示例用法
const featureManager = new FeatureManager(runtime);

// 注册特性
featureManager.registerFeature('feature_name', {
  version: 1,
  activationHeight: 1000000,
  dependencies: ['other_feature'],
  migrationHandler: migrationFunction
});

// 检查特性是否激活
const isActive = featureManager.isFeatureActivated('feature_name');
```

### 4.2 数据库迁移管理器 (MigrationManager)

数据库迁移管理器负责管理数据库结构和数据的迁移，它提供以下功能：

- 注册迁移处理函数
- 执行数据库迁移
- 跟踪已执行的迁移
- 提供事务支持和回滚机制

```javascript
// 数据库迁移管理器示例用法
const migrationManager = new MigrationManager(runtime);

// 注册迁移
migrationManager.registerMigration('migration_name', async (dao, dbTrans) => {
  // 迁移逻辑
  await dao.addColumn('table_name', 'column_name', {
    type: 'TEXT',
    allowNull: true
  }, { transaction: dbTrans });
});

// 执行迁移
await migrationManager.runMigration('migration_name');
```

### 4.3 特性配置文件 (features.js)

特性配置文件集中定义所有特性及其激活条件，它根据网络类型设置不同的激活条件：

```javascript
// 特性配置文件示例
export function getFeatureConfigs(netType) {
  // 基础配置
  const baseConfigs = {
    'feature_name': {
      version: 1,
      description: '特性描述',
      migrationHandler: migrationFunction,
      dependencies: []
    }
  };
  
  // 根据网络类型设置不同的激活条件
  switch (netType) {
    case 'mainnet':
      return {
        'feature_name': {
          ...baseConfigs.feature_name,
          activationHeight: 10000000 // 主网激活高度
        }
      };
    case 'testnet':
      return {
        'feature_name': {
          ...baseConfigs.feature_name,
          activationHeight: 100000 // 测试网激活高度
        }
      };
    default:
      return {
        'feature_name': {
          ...baseConfigs.feature_name,
          activationHeight: 1 // 本地网络立即激活
        }
      };
  }
}
```

### 4.4 特性条件检查工具 (feature-check.js)

特性条件检查工具提供了简洁的API来检查特性是否激活，并条件性地执行代码：

```javascript
// 特性条件检查工具示例用法
const featureChecker = createFeatureChecker(runtime);

// 检查特性是否激活
if (featureChecker.isFeatureActive('feature_name')) {
  // 特性激活时执行的代码
}

// 条件性执行代码
featureChecker.withFeature(
  'feature_name',
  () => {
    // 特性激活时执行的代码
  },
  () => {
    // 特性未激活时执行的代码
  }
);

// 条件性执行异步代码
await featureChecker.withFeatureAsync(
  'feature_name',
  async () => {
    // 特性激活时执行的异步代码
  },
  async () => {
    // 特性未激活时执行的异步代码
  }
);
```

## 5. 使用方法

### 5.1 定义新特性

要添加新特性，首先需要在特性配置文件中定义特性：

1. 打开 `packages/peer/src/config/features.js` 文件
2. 在 `baseConfigs` 对象中添加新特性：

```javascript
// 添加新特性
'new_feature': {
  version: 1,
  description: '新特性描述',
  migrationHandler: newFeatureMigration,
  dependencies: [] // 如果依赖其他特性，在这里添加
}
```

3. 为不同网络类型设置激活条件：

```javascript
// 主网配置
case NETWORK_TYPES.MAINNET:
  return {
    // 其他特性...
    'new_feature': {
      ...baseConfigs.new_feature,
      activationHeight: 10000000 // 设置一个未来的区块高度
    }
  };

// 测试网配置
case NETWORK_TYPES.TESTNET:
  return {
    // 其他特性...
    'new_feature': {
      ...baseConfigs.new_feature,
      activationHeight: 100000 // 测试网较早激活
    }
  };

// 本地网络配置
default:
  return {
    // 其他特性...
    'new_feature': {
      ...baseConfigs.new_feature,
      activationHeight: 1 // 本地网络立即激活
    }
  };
```

### 5.2 创建数据库迁移

如果新特性需要修改数据库结构，需要创建数据库迁移脚本：

1. 在 `packages/peer/src/db/migrations/` 目录下创建新文件，例如 `new-feature-migration.js`：

```javascript
// 新特性数据库迁移脚本
import { System } from '../../utils/system'

export async function newFeatureMigration(dao, dbTrans) {
  try {
    // 1. 检查是否需要添加新字段
    const hasNewColumn = await dao.columnExists('table_name', 'new_column')
    
    // 如果字段不存在，添加字段
    if (!hasNewColumn) {
      await dao.addColumn('table_name', 'new_column', {
        type: 'DATA_TYPE',
        allowNull: true
      }, { transaction: dbTrans })
      
      console.log('Added new_column to table_name')
    }
    
    // 2. 为现有记录设置默认值
    const records = await dao.findList('table_name', {
      where: {
        new_column: null
      },
      transaction: dbTrans
    })
    
    console.log(`Found ${records.length} records without new_column`)
    
    for (const record of records) {
      // 更新记录
      await dao.update('table_name', {
        new_column: 'default_value'
      }, {
        where: {
          id: record.id
        },
        transaction: dbTrans
      })
    }
    
    console.log(`Updated ${records.length} records with default values`)
    
    console.log('Migration completed successfully')
  } catch (err) {
    console.error(`Migration failed: ${System.getErrorMsg(err)}`)
    throw err
  }
}
```

2. 在特性配置文件中引用迁移脚本：

```javascript
import { newFeatureMigration } from '../db/migrations/new-feature-migration'

// 在特性配置中添加迁移处理函数
'new_feature': {
  version: 1,
  description: '新特性描述',
  migrationHandler: newFeatureMigration,
  dependencies: []
}
```

### 5.3 在代码中使用特性检查

在代码中使用特性检查来条件性地执行新功能：

```javascript
// 简单条件检查
if (this.runtime.featureChecker.isFeatureActive('new_feature')) {
  // 新特性激活时执行的代码
} else {
  // 新特性未激活时执行的代码
}

// 使用withFeature方法
this.runtime.featureChecker.withFeature(
  'new_feature',
  () => {
    // 新特性激活时执行的代码
  },
  () => {
    // 新特性未激活时执行的代码
  }
);

// 使用withFeatureAsync方法处理异步代码
await this.runtime.featureChecker.withFeatureAsync(
  'new_feature',
  async () => {
    // 新特性激活时执行的异步代码
  },
  async () => {
    // 新特性未激活时执行的异步代码
  }
);
```

### 5.4 修改API接口

如果新特性需要修改API接口，使用特性检查来条件性地处理请求：

```javascript
async someApiMethod(req) {
  // 如果特性未激活，返回错误
  if (!this.runtime.featureChecker.isFeatureActive('new_feature')) {
    return {
      success: false,
      error: 'This feature is not activated yet'
    };
  }
  
  // 特性激活时的处理逻辑
  const body = Object.assign({}, req.body, req.query);
  
  // 验证请求参数
  const validateSchema = {
    type: 'object',
    properties: {
      // 参数定义
    },
    required: ['required_param']
  };
  
  const validateErrors = await this.ddnSchema.validate(validateSchema, body);
  if (validateErrors) {
    return {
      success: false,
      error: `Validation error: ${validateErrors[0].message}`
    };
  }
  
  // 处理请求
  try {
    // 业务逻辑
    return {
      success: true,
      data: result
    };
  } catch (err) {
    return {
      success: false,
      error: System.getErrorMsg(err)
    };
  }
}
```

## 6. 升级流程

### 6.1 开发阶段

1. **定义特性**：在特性配置文件中定义新特性及其激活条件
2. **创建迁移**：如果需要修改数据库结构，创建数据库迁移脚本
3. **实现功能**：使用特性检查来条件性地执行新功能
4. **测试兼容性**：确保新节点可以验证旧区块，旧节点可以与新节点通信

### 6.2 测试阶段

1. **部署测试网**：在测试网上部署新版本
2. **设置较低激活高度**：为测试网设置较低的激活高度，快速测试特性激活
3. **验证功能**：确保特性在激活后正常工作
4. **验证兼容性**：确保特性激活前后的区块都可以被验证

### 6.3 发布阶段

1. **设置主网激活高度**：为主网设置一个未来的激活高度，给节点运营者足够的更新时间
2. **发布新版本**：发布包含新特性的新版本
3. **通知社区**：通知社区即将激活的新特性及其激活高度
4. **监控升级**：监控节点升级情况，确保大多数节点在特性激活前更新

### 6.4 激活阶段

1. **自动激活**：当区块链达到预设的激活高度时，新特性自动激活
2. **执行迁移**：特性激活时自动执行数据库迁移
3. **监控网络**：监控网络状态，确保特性激活后网络稳定
4. **支持节点**：为节点运营者提供技术支持，解决可能出现的问题

## 7. 实际案例：多重签名权重系统

以下是实现多重签名权重系统的完整案例，展示了如何使用特性管理系统来安全地升级区块链功能。

### 7.1 定义特性

在 `packages/peer/src/config/features.js` 中定义多重签名权重特性：

```javascript
import { multisigWeightsMigration } from '../db/migrations/multisig-weights'

// 基础配置
const baseConfigs = {
  // 多重签名权重系统
  'multisig_weights': {
    version: 1,
    description: '为多重签名添加权重系统，使签名机制更灵活',
    migrationHandler: multisigWeightsMigration,
    dependencies: []
  }
};

// 根据网络类型设置不同的激活条件
switch (netType) {
  case NETWORK_TYPES.MAINNET:
    return {
      'multisig_weights': {
        ...baseConfigs.multisig_weights,
        activationHeight: 10000000 // 主网激活高度
      }
    };
  case NETWORK_TYPES.TESTNET:
    return {
      'multisig_weights': {
        ...baseConfigs.multisig_weights,
        activationHeight: 100000 // 测试网激活高度
      }
    };
  default:
    return {
      'multisig_weights': {
        ...baseConfigs.multisig_weights,
        activationHeight: 1 // 本地网络立即激活
      }
    };
}
```

### 7.2 创建数据库迁移

创建 `packages/peer/src/db/migrations/multisig-weights.js` 文件：

```javascript
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

### 7.3 修改多重签名资产

修改 `packages/peer/src/assets/system/multisignature.js` 文件，使用特性检查：

```javascript
async create(options, trs) {
  trs.recipientId = null
  trs.amount = '0'
  
  // 使用特性检查来决定是否包含权重
  return this.runtime.featureChecker.withFeature(
    'multisig_weights',
    () => {
      // 特性激活：包含权重
      const { min, keysgroup, lifetime, weights } = options
      trs.asset.multisignature = {
        min,
        keysgroup,
        lifetime,
        weights: weights || keysgroup.map(() => 1) // 默认每个签名者权重为1
      }
      return trs
    },
    () => {
      // 特性未激活：不包含权重
      const { min, keysgroup, lifetime } = options
      trs.asset.multisignature = {
        min,
        keysgroup,
        lifetime
      }
      return trs
    }
  )
}
```

### 7.4 修改验证逻辑

修改 `ready` 方法，使用特性检查来切换验证逻辑：

```javascript
async ready(trs, sender) {
  // 使用特性检查来决定验证方式
  return this.runtime.featureChecker.withFeatureAsync(
    'multisig_weights',
    async () => {
      // 特性激活：使用权重验证
      return this._readyWithWeights(trs, sender)
    },
    async () => {
      // 特性未激活：使用传统验证
      return this._readyTraditional(trs, sender)
    }
  )
}

// 使用权重的验证逻辑
async _readyWithWeights(trs, sender) {
  const { signatures, asset } = trs
  const { multisignatures, multimin, multiweights } = sender
  
  // 权重验证逻辑
  // ...
}

// 传统的验证逻辑
async _readyTraditional(trs, sender) {
  const { signatures, asset } = trs
  const { multisignatures, multimin } = sender
  
  // 传统验证逻辑
  // ...
}
```

### 7.5 修改API接口

修改 `packages/peer/src/network/service/api/multisignatures/index.js` 文件，使用特性检查：

```javascript
async put(req) {
  const body = Object.assign({}, req.body, req.query)
  
  // 使用特性检查来决定验证规则
  const validateSchema = this.runtime.featureChecker.isFeatureActive('multisig_weights')
    ? {
        // 包含权重的验证规则
        // ...
      }
    : {
        // 不包含权重的验证规则
        // ...
      }
  
  const validateErrors = await this.ddnSchema.validate(validateSchema, body)
  // ...
}
```

## 8. 最佳实践

### 8.1 特性命名

- 使用清晰、描述性的名称，例如 `multisig_weights` 而不是 `feature_1`
- 使用下划线分隔单词，保持一致性
- 在注释中详细描述特性的功能和目的

### 8.2 激活条件设置

- 为主网设置较高的激活高度，给节点运营者足够的更新时间
- 为测试网设置较低的激活高度，便于测试
- 为本地网络设置最低的激活高度，便于开发

### 8.3 数据迁移

- 在迁移前检查字段是否存在，避免重复操作
- 为现有记录设置合理的默认值，确保兼容性
- 使用事务保护，确保数据一致性
- 添加详细的日志，便于调试和监控

### 8.4 代码组织

- 将特性检查放在方法的开始，便于阅读和理解
- 对于复杂的逻辑，将不同版本的实现分离为独立的方法
- 使用 `withFeature` 和 `withFeatureAsync` 方法，而不是直接使用 `if` 语句
- 确保所有代码路径都有适当的错误处理

### 8.5 测试

- 为每个特性编写单元测试，测试特性激活前后的行为
- 创建集成测试，测试特性激活过程
- 测试向后兼容性，确保新节点可以验证旧区块
- 测试网络通信，确保新旧节点可以正常通信

## 9. 故障排除

### 9.1 特性未激活

如果特性未按预期激活，请检查：

- 当前区块高度是否已达到激活高度
- 特性是否正确注册
- 依赖的特性是否已激活

### 9.2 数据迁移失败

如果数据迁移失败，请检查：

- 数据库连接是否正常
- 迁移脚本是否有语法错误
- 数据库表和字段是否存在
- 是否有足够的权限执行迁移

### 9.3 验证错误

如果出现验证错误，请检查：

- 特性检查是否正确实现
- 新旧验证逻辑是否兼容
- 是否为旧数据提供了默认值

### 9.4 网络分叉

如果出现网络分叉，请检查：

- 是否有足够多的节点更新到新版本
- 特性激活条件是否设置合理
- 是否有节点使用了不兼容的版本

## 10. 结论

DDN区块链特性管理与升级系统提供了一个系统化、可持续的方法来处理区块链升级。它通过配置驱动的特性管理系统，使得开发者可以专注于功能开发，而不需要担心复杂的兼容性问题。同时，它确保了区块链网络可以平滑升级，保持数据一致性和向后兼容性。

这种方法不仅适用于当前的功能升级，也为未来的所有功能升级提供了统一的框架，大大简化了区块链升级的复杂性。通过遵循本文档中的指导和最佳实践，开发者可以安全、简单地实现区块链功能升级，确保网络的稳定和可靠。
