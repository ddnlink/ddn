# DDN区块链接口开发指南

## 1. 接口架构概述

DDN区块链系统采用了分层的接口架构设计，主要分为两大类接口：

1. **节点间通信接口（P2P接口）**：由 `peer-router.js` 实现，负责区块链节点之间的内部通信
2. **外部应用接口（HTTP API）**：由 `network/service/api` 目录下的文件实现，负责与外部应用和用户交互

这种分层设计使得系统架构更加清晰，安全性更高，同时也便于维护和扩展。

### 1.1 接口架构图

```
DDN区块链接口架构
┌─────────────────────────────────────────────────────────────┐
│                        外部应用/用户                         │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      HTTP API接口层                          │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  账户接口   │  │  交易接口   │  │      区块接口      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  委托接口   │  │  网络接口   │  │      合约接口      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       区块链核心层                           │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      P2P通信接口层                           │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  交易广播   │  │  区块同步   │  │      共识机制      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  提议广播   │  │  投票广播   │  │      签名广播      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      其他区块链节点                          │
└─────────────────────────────────────────────────────────────┘
```

## 2. 节点间通信接口（P2P接口）

### 2.1 概述

节点间通信接口由 `peer-router.js` 实现，是DDN区块链网络内部节点之间进行通信的核心组件。这些接口不对外部应用开放，仅用于区块链网络内部的数据同步和共识机制。

### 2.2 主要特点

- **高效通信**：使用protobuf进行数据编解码，提高传输效率
- **安全验证**：严格的数据验证机制，确保网络安全
- **共识支持**：提供区块提议、投票等共识机制所需的通信功能
- **数据同步**：支持区块和交易的高效同步

### 2.3 核心接口

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /tx | 接收并处理新交易 |
| POST | /block | 接收并处理新区块 |
| POST | /propose | 接收并处理区块提议 |
| POST | /vote | 接收并处理区块投票 |
| POST | /signature | 接收并处理多重签名 |
| GET | /tx | 获取未确认交易列表 |
| GET | /block | 获取区块数据 |
| GET | /block/common | 查找共同区块（用于分叉处理） |
| GET | /signature | 获取签名数据 |
| GET | /height | 获取当前区块高度 |

### 2.4 使用方式

P2P接口通过 `@ddn/p2p` 模块与其他节点进行通信。在 `peer.js` 中，创建P2P实例并使用路由器处理请求：

```javascript
import Router from './peer-router'
import { P2P } from '@ddn/p2p'

// 创建P2P实例
this.p2p = new P2P(p2pConfig)

// 路由器会处理p2p网络中的请求
```

## 3. 外部应用接口（HTTP API）

### 3.1 概述

外部应用接口由 `network/service/api` 目录下的文件实现，是DDN区块链与外部应用和用户交互的窗口。这些接口提供了丰富的功能，包括账户管理、交易提交、区块查询等。

### 3.2 主要特点

- **RESTful设计**：遵循RESTful API设计规范
- **丰富的查询功能**：支持分页、排序、过滤等高级查询
- **友好的错误处理**：提供详细的错误信息和状态码
- **安全机制**：支持白名单、黑名单等安全控制

### 3.3 接口目录结构

HTTP API接口采用目录结构形式组织，每个功能模块对应一个目录，目录下的 `index.js` 文件定义了该模块的接口方法。

```
network/service/api/
├── accounts/        # 账户相关接口
├── blocks/          # 区块相关接口
├── contracts/       # 智能合约接口
├── delegates/       # 受托人接口
├── multisignatures/ # 多重签名接口
├── network/         # 网络状态接口
├── peers/           # 节点信息接口
├── signatures/      # 签名接口
├── system/          # 系统信息接口
├── transactions/    # 交易相关接口
└── votes/           # 投票相关接口
```

### 3.4 接口命名规范

接口方法按照HTTP方法类型进行命名，遵循以下规则：

- `get`: 获取资源列表
- `getXxx`: 获取特定资源，如 `getHeight`
- `post`: 创建资源
- `put`: 更新资源
- `delete`: 删除资源

例如，定义一个获取区块高度的接口：

```javascript
async getHeight(req) {
  // 实现逻辑
  return {
    success: true,
    height: this.runtime.block.getLastBlock().height
  }
}
```

这个方法会被自动映射为 `/api/blocks/height` 路径。

### 3.5 路由映射机制

DDN使用自动路由映射机制，根据目录结构和方法名自动生成API路径：

1. 目录名映射为主路径，如 `blocks` 目录映射为 `/api/blocks`
2. 方法名映射为子路径，如 `getHeight` 方法映射为 `/height`
3. 完整路径为 `/api/blocks/height`

这种机制使得API路径清晰、一致，便于理解和使用。

### 3.6 常用接口示例

#### 3.6.1 获取账户信息

```
GET /api/accounts?address={address}
```

#### 3.6.2 提交交易

```
POST /api/transactions
```

请求体：
```json
{
  "secret": "用户密钥",
  "amount": "转账金额",
  "recipientId": "接收地址"
}
```

#### 3.6.3 获取区块信息

```
GET /api/blocks?height={height}
```

## 4. 接口开发指南

### 4.1 开发HTTP API接口

#### 4.1.1 创建新接口模块

1. 在 `network/service/api` 目录下创建新目录，如 `mymodule`
2. 在该目录下创建 `index.js` 文件
3. 定义接口类和方法

```javascript
class MyModuleService {
  constructor(context) {
    Object.assign(this, context)
    this._context = context
  }

  async get(req) {
    // 实现获取资源列表的逻辑
    return {
      success: true,
      data: []
    }
  }

  async getDetail(req) {
    // 实现获取特定资源的逻辑
    const id = req.query.id
    return {
      success: true,
      data: { id }
    }
  }

  async post(req) {
    // 实现创建资源的逻辑
    const data = req.body
    return {
      success: true,
      id: "新创建的资源ID"
    }
  }
}

export default MyModuleService
```

#### 4.1.2 参数验证

使用 `ddnSchema.validate` 进行参数验证：

```javascript
async post(req) {
  const body = req.body
  const validateErrors = await this.ddnSchema.validate(
    {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          minLength: 1,
          maxLength: 50
        },
        value: {
          type: 'integer',
          minimum: 0
        }
      },
      required: ['name', 'value']
    },
    body
  )
  
  if (validateErrors) {
    throw new Error(`Invalid parameters: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`)
  }
  
  // 继续处理逻辑
}
```

#### 4.1.3 错误处理

统一使用以下格式返回错误：

```javascript
try {
  // 业务逻辑
} catch (err) {
  return {
    success: false,
    error: err.message || err.toString()
  }
}
```

### 4.2 开发P2P接口

#### 4.2.1 扩展peer-router.js

1. 在 `Router` 类中添加新的路由方法
2. 在构造函数的 `routes` 对象中注册新路由

```javascript
constructor(context) {
  // ...现有代码...
  
  this.routes = {
    // ...现有路由...
    'POST /myroute': this.myNewRoute.bind(this)
  }
}

async myNewRoute({ body, peer }) {
  // 实现逻辑
  return { success: true }
}
```

#### 4.2.2 数据验证和处理

```javascript
async myNewRoute({ body, peer }) {
  // 解码protobuf数据（如果需要）
  if (typeof body.data === 'string') {
    body.data = this.protobuf.decodeData(Buffer.from(body.data, 'base64'))
  }
  
  // 验证数据
  const validateErrors = await this.ddnSchema.validate(
    {
      type: 'object',
      properties: {
        // 定义验证规则
      },
      required: []
    },
    body.data
  )
  
  if (validateErrors) {
    return {
      success: false,
      error: `Invalid parameters: ${validateErrors[0].message}`
    }
  }
  
  // 处理逻辑
  try {
    // 实现功能
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err.message
    }
  }
}
```

## 5. 接口优化建议

### 5.1 接口规范性

#### 5.1.1 统一的响应格式

所有API响应应遵循统一的格式：

```json
{
  "success": true|false,
  "data": {},      // 成功时返回的数据
  "error": "",     // 失败时返回的错误信息
  "meta": {}       // 元数据，如分页信息
}
```

#### 5.1.2 HTTP状态码使用

目前DDN API大多使用200状态码并在响应体中指示成功或失败。建议改进为使用标准HTTP状态码：

- 200: 成功
- 400: 请求参数错误
- 401: 未授权
- 403: 禁止访问
- 404: 资源不存在
- 500: 服务器内部错误

#### 5.1.3 版本控制

引入API版本控制机制，例如：

```
/api/v1/blocks
/api/v2/blocks
```

这样可以在保持向后兼容的同时引入新功能。

### 5.2 科学性

#### 5.2.1 参数类型处理

改进当前的参数类型处理机制，特别是对于数值类型：

- 使用BigNumber处理所有金额、费用等数值
- 明确区分整数和字符串类型参数
- 提供清晰的类型转换规则和文档

#### 5.2.2 分页机制优化

实现更科学的分页机制：

```
GET /api/blocks?page=2&limit=20&cursor=XXXX
```

响应中包含分页元数据：

```json
{
  "success": true,
  "data": [...],
  "meta": {
    "page": 2,
    "limit": 20,
    "total": 1000,
    "next_cursor": "YYYY",
    "prev_cursor": "XXXX"
  }
}
```

#### 5.2.3 查询语言

引入简化的查询语言，支持更复杂的过滤和排序：

```
GET /api/transactions?filter=amount>1000,type=0&sort=-timestamp
```

### 5.3 简易性

#### 5.3.1 简化接口路径

当前一些接口路径设计较为复杂，建议简化：

- 使用资源名称的复数形式作为主路径
- 使用HTTP方法表达操作类型
- 使用嵌套资源表达从属关系

例如，将 `GET /api/accounts/getPublicKey` 简化为 `GET /api/accounts/{address}/publicKey`

#### 5.3.2 减少重复代码

创建通用的中间件和工具函数，减少接口实现中的重复代码：

- 参数验证中间件
- 错误处理中间件
- 通用的查询构建函数
- 响应格式化工具

#### 5.3.3 自动化文档

引入OpenAPI（Swagger）规范，自动生成API文档：

```javascript
/**
 * @swagger
 * /api/blocks:
 *   get:
 *     summary: 获取区块列表
 *     parameters:
 *       - name: height
 *         in: query
 *         description: 区块高度
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功返回区块列表
 */
async get(req) {
  // 实现逻辑
}
```

### 5.4 兼容性

#### 5.4.1 向后兼容策略

在更新API时，确保向后兼容：

- 不删除现有字段，而是标记为废弃
- 新增字段而不是修改现有字段的含义
- 提供兼容层处理旧版本请求

#### 5.4.2 优雅降级

实现API的优雅降级机制：

- 当请求的功能不可用时，返回有意义的错误信息
- 支持部分成功的响应
- 提供回退机制和替代方案

#### 5.4.3 跨平台支持

确保API在不同环境中的一致性：

- 统一处理时间格式（ISO 8601）
- 使用UTF-8编码处理国际字符
- 考虑不同客户端的限制和特性

## 6. 接口安全性

### 6.1 认证与授权

#### 6.1.1 API密钥

为敏感操作引入API密钥机制：

```
GET /api/accounts?api_key=YOUR_API_KEY
```

#### 6.1.2 JWT认证

实现JWT（JSON Web Token）认证机制：

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 6.1.3 细粒度权限控制

实现基于角色的访问控制（RBAC）：

- 只读权限
- 交易提交权限
- 管理权限

### 6.2 安全防护

#### 6.2.1 速率限制

实现请求速率限制，防止DoS攻击：

```javascript
// 中间件实现
function rateLimiter(req, res, next) {
  // 检查IP或API密钥的请求频率
  // 超过限制则拒绝请求
}
```

#### 6.2.2 输入验证

加强所有API输入的验证：

- 验证参数类型和范围
- 过滤特殊字符
- 限制输入长度

#### 6.2.3 HTTPS

强制使用HTTPS，确保数据传输安全。

## 7. 接口测试

### 7.1 单元测试

为每个接口编写单元测试，验证其功能和边界条件：

```javascript
describe('Blocks API', () => {
  it('should return block by height', async () => {
    // 测试实现
  })
  
  it('should handle invalid height parameter', async () => {
    // 测试实现
  })
})
```

### 7.2 集成测试

编写集成测试，验证接口之间的交互：

```javascript
describe('Transaction flow', () => {
  it('should create and confirm transaction', async () => {
    // 创建交易
    // 验证交易进入未确认池
    // 等待确认
    // 验证交易已确认
  })
})
```

### 7.3 性能测试

进行性能测试，确保接口在高负载下的表现：

- 测量响应时间
- 测试并发请求处理能力
- 识别性能瓶颈

## 8. 最佳实践

### 8.1 接口设计原则

- **简单性**：接口应该简单直观，易于理解和使用
- **一致性**：保持命名、参数和响应格式的一致性
- **可扩展性**：设计应考虑未来的扩展需求
- **可测试性**：接口应易于测试，包括自动化测试

### 8.2 文档和示例

- 提供详细的API文档
- 包含请求和响应示例
- 说明错误码和处理方式
- 提供SDK和代码示例

### 8.3 监控和日志

- 实现接口调用日志
- 监控接口性能和错误率
- 设置告警机制
- 定期分析使用模式和优化机会

## 9. 结论

DDN区块链的接口架构采用了分层设计，清晰地分离了节点间通信和外部应用接口。通过遵循本文提出的规范和建议，可以构建更加规范、科学、简易和兼容的API，提升开发体验和系统质量。

接口是区块链系统与外界交互的窗口，其设计质量直接影响系统的可用性和开发者体验。通过持续改进和优化接口设计，DDN区块链可以为开发者提供更好的工具，促进生态系统的发展。
