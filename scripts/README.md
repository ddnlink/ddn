# DDN智能合约测试脚本

本目录包含用于测试DDN智能合约的各种脚本。

## 安装依赖

在使用这些脚本之前，请先安装必要的依赖：

```bash
cd scripts
npm install
```

## 可用脚本

### 1. 查询合约元数据

查询合约的详细信息、代码和元数据。

```bash
node query-contract-metadata.js [合约ID]
```

### 2. 调用合约只读方法

调用合约的只读方法，不修改合约状态。

```bash
node call-contract-readonly.js [合约ID] [方法名] [参数JSON字符串]
```

示例：
```bash
node call-contract-readonly.js D2KjLsCjEMQCcC7KXMvwbav8mNQvLP6A1A getValue "[]"
node call-contract-readonly.js D2KjLsCjEMQCcC7KXMvwbav8mNQvLP6A1A balanceOf "[\"D4sYJdcmRhimNdW6uehE6jTLbUak28ZCkD\"]"
```

### 3. 调用合约状态修改方法

调用合约的状态修改方法，需要创建交易并广播。

```bash
node call-contract-send.js [合约ID] [方法名] [参数JSON字符串] [密钥]
```

示例：
```bash
node call-contract-send.js D2KjLsCjEMQCcC7KXMvwbav8mNQvLP6A1A setValue "[\"Hello World\"]" "your secret passphrase"
```

### 4. 向合约转账

向合约发送资产，并调用指定的方法。

```bash
node contract-pay.js [合约ID] [方法名] [金额] [货币] [参数JSON字符串] [密钥]
```

示例：
```bash
node contract-pay.js D2KjLsCjEMQCcC7KXMvwbav8mNQvLP6A1A deposit 100 DDN "[]" "your secret passphrase"
```

### 5. 部署简单合约

部署一个简单的测试合约。

```bash
node simple-contract-deploy.js [合约名称] [密钥]
```

示例：
```bash
node simple-contract-deploy.js SimpleContract "your secret passphrase"
```

## 注意事项

1. 所有脚本默认连接到本地节点（http://127.0.0.1:8001）。如需连接其他节点，请修改脚本中的配置。
2. 默认使用的测试账户密钥为："finish valley own jealous lobster mother inflict voice sphere stay second puppy"。
3. 部署合约后，请记录合约ID，用于后续测试。
4. 如果合约调用失败，请检查合约是否已部署、方法是否存在、参数是否正确。
