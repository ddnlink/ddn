# DDN 智能合约 API 文档

本文档详细说明了 DDN 区块链中智能合约相关的 API 接口。

## 1. 合约查询接口

### 1.1 获取合约列表

**接口**：`GET /api/contracts`

**描述**：获取系统中的合约列表

**参数**：

| 参数名 | 类型 | 必填 | 描述 |
| ----- | ---- | ---- | ---- |
| limit | number | 否 | 返回结果数量限制，默认为 10，最大为 100 |
| offset | number | 否 | 偏移量，默认为 0 |
| orderBy | string | 否 | 排序字段，如 "id:desc" |
| id | string | 否 | 按合约 ID 筛选 |
| name | string | 否 | 按合约名称筛选 |
| owner | string | 否 | 按合约所有者筛选 |

**返回示例**：

```json
{
  "success": true,
  "rows": [
    {
      "id": "DMDdssMswpfBT7LQcyeanf3FGP95K8oKCH",
      "name": "MinimalContract",
      "owner": "D5zGP4ueZZ4ZmCGEzAqNMMwuL6iGSz2qGX",
      "transaction_id": "f328d5e1e1f06c31a0a9320e7cd32f697cecb2dde09ee9d3b4aa9dca3626a8d1",
      "gasLimit": 10000000,
      "timestamp": 84775058,
      "version": "1.0.0",
      "desc": "MinimalContract - DDN智能合约示例"
    }
  ],
  "totalCount": 1
}
```

### 1.2 获取合约详情

**接口**：`GET /api/contracts/get?id=<合约ID>` 或 `GET /api/contracts/<合约ID>`

**描述**：获取指定合约的详细信息

**参数**：

| 参数名 | 类型 | 必填 | 描述 |
| ----- | ---- | ---- | ---- |
| id | string | 是 | 合约 ID |

**返回示例**：

```json
{
  "success": true,
  "contract": {
    "id": "DMDdssMswpfBT7LQcyeanf3FGP95K8oKCH",
    "name": "MinimalContract",
    "owner": "D5zGP4ueZZ4ZmCGEzAqNMMwuL6iGSz2qGX",
    "transaction_id": "f328d5e1e1f06c31a0a9320e7cd32f697cecb2dde09ee9d3b4aa9dca3626a8d1",
    "gasLimit": 10000000,
    "timestamp": 84775058,
    "version": "1.0.0",
    "desc": "MinimalContract - DDN智能合约示例"
  }
}
```

### 1.3 获取合约元数据

**接口**：`GET /api/contracts/metadata?id=<合约ID>`

**描述**：获取指定合约的元数据信息

**参数**：

| 参数名 | 类型 | 必填 | 描述 |
| ----- | ---- | ---- | ---- |
| id | string | 是 | 合约 ID |

**返回示例**：

```json
{
  "success": true,
  "metadata": "合约元数据内容"
}
```

### 1.4 获取合约代码

**接口**：`GET /api/contracts/code?id=<合约ID>`

**描述**：获取指定合约的代码

**参数**：

| 参数名 | 类型 | 必填 | 描述 |
| ----- | ---- | ---- | ---- |
| id | string | 是 | 合约 ID |

**返回示例**：

```json
{
  "success": true,
  "code": "合约代码内容"
}
```

## 2. 合约执行结果查询

### 2.1 获取合约执行结果

**接口**：`GET /api/contracts/result?id=<合约ID>`

**描述**：获取指定合约的最新执行结果

**参数**：

| 参数名 | 类型 | 必填 | 描述 |
| ----- | ---- | ---- | ---- |
| id | string | 是 | 合约 ID |
| transactionId | string | 否 | 交易 ID，如果提供则查询指定交易的执行结果 |

**返回示例**：

```json
{
  "success": true,
  "result": {
    "transaction_id": "f328d5e1e1f06c31a0a9320e7cd32f697cecb2dde09ee9d3b4aa9dca3626a8d1",
    "contract_id": "DMDdssMswpfBT7LQcyeanf3FGP95K8oKCH",
    "gas": 1000,
    "success": true,
    "data": "执行结果数据",
    "stateChangesHash": "状态变更哈希",
    "transaction": {
      // 交易详情
    }
  }
}
```

### 2.2 获取合约执行结果列表

**接口**：`GET /api/contracts/results?id=<合约ID>`

**描述**：获取指定合约的执行结果列表

**参数**：

| 参数名 | 类型 | 必填 | 描述 |
| ----- | ---- | ---- | ---- |
| id | string | 是 | 合约 ID |
| limit | number | 否 | 返回结果数量限制，默认为 20，最大为 100 |
| offset | number | 否 | 偏移量，默认为 0 |

**返回示例**：

```json
{
  "success": true,
  "count": 1,
  "rows": [
    {
      "transaction_id": "f328d5e1e1f06c31a0a9320e7cd32f697cecb2dde09ee9d3b4aa9dca3626a8d1",
      "contract_id": "DMDdssMswpfBT7LQcyeanf3FGP95K8oKCH",
      "gas": 1000,
      "success": true,
      "data": "执行结果数据",
      "stateChangesHash": "状态变更哈希",
      "interface": "方法名(参数)"
    }
  ]
}
```

### 2.3 获取合约转账记录

**接口**：`GET /api/contracts/transfers`

**描述**：获取合约相关的转账记录

**参数**：

| 参数名 | 类型 | 必填 | 描述 |
| ----- | ---- | ---- | ---- |
| senderId | string | 否 | 发送方地址 |
| recipientId | string | 否 | 接收方地址 |
| limit | number | 否 | 返回结果数量限制，默认为 20，最大为 100 |
| offset | number | 否 | 偏移量，默认为 0 |

**返回示例**：

```json
{
  "success": true,
  "count": 1,
  "rows": [
    {
      "sender_id": "D5zGP4ueZZ4ZmCGEzAqNMMwuL6iGSz2qGX",
      "recipient_id": "DMDdssMswpfBT7LQcyeanf3FGP95K8oKCH",
      "amount": "1000000000",
      "currency": "DDN",
      "block_height": 100
    }
  ]
}
```

## 3. 合约状态查询

### 3.1 获取合约状态

**接口**：`GET /api/contracts/states?id=<合约ID>&statePath=<状态路径>`

**描述**：获取指定合约的状态数据

**参数**：

| 参数名 | 类型 | 必填 | 描述 |
| ----- | ---- | ---- | ---- |
| id | string | 是 | 合约 ID |
| statePath | string | 是 | 状态路径，使用点号分隔，如 "holding.0" |

**返回示例**：

```json
{
  "success": true,
  "states": {
    "key1": "value1",
    "key2": 123
  }
}
```

## 4. 合约调用

### 4.1 调用合约只读方法

**接口**：`POST /api/contracts/call`

**描述**：调用合约的只读方法（不修改状态）

**请求体**：

```json
{
  "id": "DMDdssMswpfBT7LQcyeanf3FGP95K8oKCH",
  "method": "getBalance",
  "args": ["D5zGP4ueZZ4ZmCGEzAqNMMwuL6iGSz2qGX"]
}
```

**参数**：

| 参数名 | 类型 | 必填 | 描述 |
| ----- | ---- | ---- | ---- |
| id | string | 是 | 合约 ID |
| method | string | 是 | 方法名称 |
| args | array | 否 | 方法参数数组 |

**返回示例**：

```json
{
  "success": true,
  "result": 1000000000
}
```

## 5. 错误处理

所有 API 在出错时会返回带有 `success: false` 和 `error` 字段的 JSON 对象：

```json
{
  "success": false,
  "error": "错误信息"
}
```

常见错误包括：

- `Contract ID is required`：未提供合约 ID
- `Contract with ID xxx not found`：找不到指定 ID 的合约
- `Invalid parameters`：参数无效
- `Blockchain is loading`：区块链正在加载中，暂时无法处理请求

## 6. 注意事项

1. 所有 API 请求应包含以下 HTTP 头：
   - `nethash: m66gcvle`
   - `version: 1.0.0`

2. 合约 ID 通常是一个 DDN 地址格式的字符串，例如 `DMDdssMswpfBT7LQcyeanf3FGP95K8oKCH`。

3. 查询合约结果时，如果只提供合约 ID 而不提供交易 ID，系统会返回该合约的最新执行结果。

4. 合约状态查询使用点号分隔的路径格式，例如 `holding.0` 表示访问 `contract.holding[0]`。
