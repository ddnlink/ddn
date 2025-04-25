# 防止重复提交多重签名交易的实施建议

## 问题背景

在DDN区块链中，一个账号只能有一组多重签名配置。然而，当前系统在用户尝试为已有多重签名的账号再次创建多重签名时，只会在交易验证阶段拒绝交易并返回错误，没有提前预防机制。这导致以下问题：

1. **用户体验不佳**：用户可能不知道一个账号只能有一组多重签名，导致重复提交。
2. **资源浪费**：无效交易会占用网络带宽和节点处理资源。
3. **操作混淆**：对于需要多人签名的交易，可能会浪费其他签名者的时间。

## 解决方案

在区块链API层面实现严格的检查机制，从根本上杜绝用户重复提交多重签名交易的问题。

### 实施步骤

#### 1. 修改多重签名API的`put`方法

在创建多重签名交易前增加账号状态检查：

```javascript
async put (req) {
  // 原有的参数验证代码...

  return this.balancesSequence.addAsync(async () => {
    const publicKey = keypair.publicKey;
    let account;

    try {
      account = await this.runtime.account.getAccountByPublicKey(publicKey);
    } catch (err) {
      throw err;
    }

    if (!account) {
      throw new Error('Account ' + publicKey + ' not found');
    }

    // 检查账号是否已有多重签名
    if (account.multisignatures && account.multisignatures.length > 0) {
      return {
        success: false,
        error: '账号已启用多重签名，不能创建新的多重签名配置',
        details: {
          currentMultisig: {
            min: account.multimin,
            lifetime: account.multilifetime,
            keysgroup: account.multisignatures
          }
        }
      };
    }

    // 检查是否有未确认的多重签名交易
    const pendingTxs = await this.runtime.transaction.getUnconfirmedTransactionList();
    const accountPendingMultisigTxs = pendingTxs.filter(tx => 
      tx.senderId === account.address && 
      tx.type === assetTypes.MULTISIGNATURE
    );
    
    if (accountPendingMultisigTxs.length > 0) {
      return {
        success: false,
        error: '账号有未确认的多重签名交易，请等待确认后再操作',
        details: {
          pendingTransactions: accountPendingMultisigTxs.map(tx => ({
            id: tx.id,
            min: tx.asset.multisignature.min,
            lifetime: tx.asset.multisignature.lifetime,
            keysgroup: tx.asset.multisignature.keysgroup,
            signatures: tx.signatures ? tx.signatures.length : 0,
            requiredSignatures: tx.asset.multisignature.keysgroup.length
          }))
        }
      };
    }

    // 继续原有的交易创建流程...
  });
}
```

#### 2. 添加新的API接口用于检查账号是否可以创建多重签名

```javascript
/**
 * 检查账号是否可以创建多重签名
 * 
 * get /api/multisignatures/checkEligibility?address=账号地址
 * 
 * @param {*} req 请求对象，包含账号地址
 * @returns {Object} 包含账号是否可以创建多重签名的信息
 */
async getCheckEligibility(req) {
  const query = Object.assign({}, req.body, req.query)
  const validateErrors = await this.ddnSchema.validate(
    {
      type: 'object',
      properties: {
        address: {
          type: 'string'
        },
        publicKey: {
          type: 'string',
          format: 'publicKey'
        }
      },
      required: ['address']
    },
    query
  )
  if (validateErrors) {
    return {
      success: false,
      error: `Validation error: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`
    }
  }
  
  try {
    // 获取账号信息
    const account = await this.runtime.account.getAccountByAddress(query.address);
    
    if (!account) {
      return {
        success: false,
        error: '账号不存在'
      };
    }
    
    // 检查是否已有多重签名
    if (account.multisignatures && account.multisignatures.length > 0) {
      return {
        success: true,
        eligible: false,
        reason: '账号已启用多重签名，不能创建新的多重签名配置',
        details: {
          currentMultisig: {
            min: account.multimin,
            lifetime: account.multilifetime,
            keysgroup: account.multisignatures
          }
        }
      };
    }
    
    // 检查是否有未确认的多重签名交易
    const pendingTxs = await this.runtime.transaction.getUnconfirmedTransactionList();
    const accountPendingMultisigTxs = pendingTxs.filter(tx => 
      tx.senderId === query.address && 
      tx.type === assetTypes.MULTISIGNATURE
    );
    
    if (accountPendingMultisigTxs.length > 0) {
      return {
        success: true,
        eligible: false,
        reason: '账号有未确认的多重签名交易，请等待确认后再操作',
        details: {
          pendingTransactions: accountPendingMultisigTxs.map(tx => ({
            id: tx.id,
            min: tx.asset.multisignature.min,
            lifetime: tx.asset.multisignature.lifetime,
            keysgroup: tx.asset.multisignature.keysgroup,
            signatures: tx.signatures ? tx.signatures.length : 0,
            requiredSignatures: tx.asset.multisignature.keysgroup.length
          }))
        }
      };
    }
    
    return {
      success: true,
      eligible: true,
      message: '账号可以创建多重签名'
    };
  } catch (err) {
    this.logger.error('检查账号多重签名资格失败: ', System.getErrorMsg(err));
    return {
      success: false,
      error: System.getErrorMsg(err)
    };
  }
}
```

### 前端集成示例

```javascript
// 在用户提交多重签名前检查账号状态
async function checkMultisigEligibility(address) {
  try {
    const response = await fetch(`/api/multisignatures/checkEligibility?address=${address}`);
    const result = await response.json();
    
    if (!result.success) {
      showError(`检查失败: ${result.error}`);
      return false;
    }
    
    if (!result.eligible) {
      // 显示详细的不可创建原因
      showWarning(result.reason);
      
      // 如果有当前多重签名信息，显示详情
      if (result.details && result.details.currentMultisig) {
        showMultisigDetails(result.details.currentMultisig);
      }
      
      // 如果有未确认交易，显示详情
      if (result.details && result.details.pendingTransactions) {
        showPendingTransactions(result.details.pendingTransactions);
      }
      
      return false;
    }
    
    return true;
  } catch (error) {
    showError(`检查失败: ${error.message}`);
    return false;
  }
}

// 在提交按钮点击事件中使用
submitButton.onclick = async () => {
  if (await checkMultisigEligibility(currentAddress)) {
    // 继续提交流程
    submitMultisignatureTransaction();
  }
};
```

## API文档更新

需要在API文档中添加新接口的说明，以及更新多重签名创建接口的说明。

### 新增API接口文档

```markdown
## 检查账号是否可以创建多重签名
接口地址：/api/multisignatures/checkEligibility
请求方式：get
支持格式：urlencoded
请求参数说明：

|名称	|类型   |必填 |说明              |
|------ |-----  |---  |----              |
|address|string |Y    |DDN账户地址       |

返回参数说明：

|名称	|类型   |说明              |
|------ |-----  |----              |
|success|boolean|请求是否成功      |
|eligible|boolean|账号是否可以创建多重签名|
|reason|string|如果不可创建，说明原因|
|details|object|详细信息，包括当前多重签名配置或未确认交易|

请求示例：
```bash
curl -k -X GET http://127.0.0.1:8001/api/multisignatures/checkEligibility?address=D5H4HXQLiYdHsHZpoE7zpYea6g6xNsQJvx
```

JSON返回示例（账号可以创建多重签名）：
```js
{
    "success": true,
    "eligible": true,
    "message": "账号可以创建多重签名"
}
```

JSON返回示例（账号已有多重签名）：
```js
{
    "success": true,
    "eligible": false,
    "reason": "账号已启用多重签名，不能创建新的多重签名配置",
    "details": {
        "currentMultisig": {
            "min": 2,
            "lifetime": 1,
            "keysgroup": [
                "+daeee33def7eef0c7ba06ec66eda7204437ba88ace8f04e4a6aa4d7bfbd18bc1",
                "+ab8c0af3b048dac4d32ad779f79c47948c2a0a0577b89ca7eba58ae321f04695"
            ]
        }
    }
}
```
```

## 实施效果

通过上述修改，我们实现了以下功能：

1. **在创建多重签名交易前进行严格检查**：
   - 检查账号是否已有多重签名
   - 检查账号是否有未确认的多重签名交易

2. **提供详细的错误信息**：
   - 如果账号已有多重签名，返回当前多重签名的详细信息
   - 如果有未确认的多重签名交易，返回这些交易的详细信息

3. **提供专门的API接口用于预检查**：
   - 客户端可以在用户操作前调用`/api/multisignatures/checkEligibility`接口
   - 用户界面可以根据返回结果显示适当的提示信息

## 优势

1. **彻底解决问题**：在交易创建前就进行检查，而不是等到交易验证阶段才拒绝。

2. **提供详细信息**：返回详细的错误原因和当前状态，帮助用户理解问题。

3. **提高用户体验**：用户可以立即知道操作是否可行，避免无效操作。

4. **减少资源浪费**：防止无效交易占用网络和节点资源。

5. **统一处理**：所有客户端都通过相同的API接口，确保行为一致。

## 实施建议

为了有效实施这些改进，建议按以下顺序进行：

1. **首先改进文档**：更新API文档，明确说明一个账号只能有一组多重签名配置。

2. **实现API预检查接口**：添加`getCheckEligibility`方法。

3. **修改多重签名创建接口**：在`put`方法中增加预检查逻辑。

4. **更新前端应用**：在用户界面中集成预检查功能。

通过这些改进，可以显著提高用户体验，减少无效交易的提交，同时不需要对核心区块链逻辑进行重大修改。
