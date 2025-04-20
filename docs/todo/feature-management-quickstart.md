---
order: 11
id: feature-management-quickstart
title: DDN区块链特性管理快速入门
sidebar_label: 特性管理快速入门
---

# DDN区块链特性管理快速入门

本文档提供了DDN区块链特性管理系统的快速入门指南，帮助开发者快速上手。更详细的说明请参考[特性管理与升级系统](./feature-management-system.md)文档。

## 1. 添加新特性

### 步骤1: 定义特性

在 `packages/peer/src/config/features.js` 文件中添加新特性：

```javascript
// 基础配置
const baseConfigs = {
  // 已有特性...
  
  // 添加新特性
  'your_feature_name': {
    version: 1,
    description: '特性描述',
    migrationHandler: yourFeatureMigration, // 如果需要数据迁移
    dependencies: [] // 如果依赖其他特性，在这里添加
  }
};

// 设置激活条件
switch (netType) {
  case NETWORK_TYPES.MAINNET:
    return {
      // 已有特性...
      'your_feature_name': {
        ...baseConfigs.your_feature_name,
        activationHeight: 10000000 // 主网激活高度
      }
    };
  
  case NETWORK_TYPES.TESTNET:
    return {
      // 已有特性...
      'your_feature_name': {
        ...baseConfigs.your_feature_name,
        activationHeight: 100000 // 测试网激活高度
      }
    };
  
  default:
    return {
      // 已有特性...
      'your_feature_name': {
        ...baseConfigs.your_feature_name,
        activationHeight: 1 // 本地网络立即激活
      }
    };
}
```

### 步骤2: 创建数据迁移（如需要）

在 `packages/peer/src/db/migrations/` 目录下创建迁移文件：

```javascript
// your-feature-migration.js
import { System } from '../../utils/system'

export async function yourFeatureMigration(dao, dbTrans) {
  try {
    // 1. 添加新字段
    const hasNewColumn = await dao.columnExists('table_name', 'new_column')
    if (!hasNewColumn) {
      await dao.addColumn('table_name', 'new_column', {
        type: 'DATA_TYPE',
        allowNull: true
      }, { transaction: dbTrans })
    }
    
    // 2. 为现有记录设置默认值
    const records = await dao.findList('table_name', {
      where: { new_column: null },
      transaction: dbTrans
    })
    
    for (const record of records) {
      await dao.update('table_name', {
        new_column: 'default_value'
      }, {
        where: { id: record.id },
        transaction: dbTrans
      })
    }
    
    console.log('Migration completed successfully')
  } catch (err) {
    console.error(`Migration failed: ${System.getErrorMsg(err)}`)
    throw err
  }
}
```

### 步骤3: 在代码中使用特性检查

在代码中使用特性检查来条件性地执行新功能：

```javascript
// 简单条件检查
if (this.runtime.featureChecker.isFeatureActive('your_feature_name')) {
  // 新特性激活时执行的代码
} else {
  // 新特性未激活时执行的代码
}

// 使用withFeature方法
this.runtime.featureChecker.withFeature(
  'your_feature_name',
  () => {
    // 新特性激活时执行的代码
  },
  () => {
    // 新特性未激活时执行的代码
  }
);

// 使用withFeatureAsync方法处理异步代码
await this.runtime.featureChecker.withFeatureAsync(
  'your_feature_name',
  async () => {
    // 新特性激活时执行的异步代码
  },
  async () => {
    // 新特性未激活时执行的异步代码
  }
);
```

## 2. 特性管理系统模板

### 特性配置模板

```javascript
// 特性配置模板
'feature_name': {
  version: 1,                    // 特性版本
  description: '特性描述',        // 特性描述
  migrationHandler: migrationFn, // 数据迁移处理函数
  dependencies: ['other_feature'],// 依赖的其他特性
  activationHeight: 1000000      // 激活区块高度
}
```

### 数据迁移模板

```javascript
// 数据迁移模板
export async function migrationTemplate(dao, dbTrans) {
  try {
    // 1. 添加新字段
    if (!await dao.columnExists('table_name', 'column_name')) {
      await dao.addColumn('table_name', 'column_name', {
        type: 'DATA_TYPE',
        allowNull: true
      }, { transaction: dbTrans });
    }
    
    // 2. 更新现有数据
    await dao.update('table_name', {
      column_name: 'default_value'
    }, {
      where: { column_name: null },
      transaction: dbTrans
    });
    
    console.log('Migration completed successfully');
  } catch (err) {
    console.error(`Migration failed: ${err.message}`);
    throw err;
  }
}
```

### API方法模板

```javascript
// API方法模板
async apiMethodTemplate(req) {
  // 检查特性是否激活
  if (!this.runtime.featureChecker.isFeatureActive('feature_name')) {
    return {
      success: false,
      error: 'This feature is not activated yet'
    };
  }
  
  // 验证请求参数
  const body = Object.assign({}, req.body, req.query);
  const validateErrors = await this.ddnSchema.validate(
    {
      type: 'object',
      properties: {
        // 参数定义
      },
      required: ['required_param']
    },
    body
  );
  
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

## 3. 特性激活流程

1. **开发**：定义特性，创建迁移，实现功能
2. **测试**：在测试网上部署，设置较低激活高度
3. **发布**：设置主网激活高度，发布新版本
4. **激活**：当区块链达到激活高度时，特性自动激活

## 4. 常见问题

### 特性未激活

- 检查当前区块高度是否已达到激活高度
- 检查特性是否正确注册
- 检查依赖的特性是否已激活

### 数据迁移失败

- 检查数据库连接是否正常
- 检查迁移脚本是否有语法错误
- 检查是否有足够的权限执行迁移

### 验证错误

- 检查特性检查是否正确实现
- 检查新旧验证逻辑是否兼容
- 检查是否为旧数据提供了默认值

## 5. 最佳实践

- 使用清晰、描述性的特性名称
- 为主网设置较高的激活高度，给节点运营者足够的更新时间
- 在迁移前检查字段是否存在，避免重复操作
- 为现有记录设置合理的默认值，确保兼容性
- 使用事务保护，确保数据一致性
- 添加详细的日志，便于调试和监控

更多详细信息，请参考[特性管理与升级系统](./feature-management-system.md)文档。
