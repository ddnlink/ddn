# DDN智能合约元数据开发指南

## 1. 元数据概述

### 1.1 什么是合约元数据

合约元数据（Contract Metadata）是对智能合约结构和功能的描述性信息，它包含了合约的类名、状态变量、方法、参数、返回类型等关键信息。元数据不包含具体的实现代码，而是对合约结构的抽象描述，类似于接口定义或API文档。

### 1.2 元数据的作用

合约元数据在DDN智能合约系统中具有以下关键作用：

1. **合约验证**：在部署和执行前验证合约的语法和结构是否符合规范
2. **接口描述**：为外部调用者提供合约功能的详细描述
3. **状态管理**：定义合约状态变量的类型和访问权限
4. **方法调用**：提供方法签名、参数类型和返回值类型信息
5. **Gas计算**：辅助计算合约执行所需的计算资源
6. **ABI生成**：为前端应用提供应用程序二进制接口(ABI)
7. **合约升级**：在合约升级过程中确保兼容性

## 2. 元数据生成流程

### 2.1 从合约代码到元数据的转换过程

合约元数据的生成是在合约编译过程中完成的，主要步骤如下：

1. **代码解析**：使用TypeScript编译器解析合约源代码
2. **AST分析**：分析抽象语法树(AST)，提取合约结构信息
3. **类型解析**：解析变量、参数和返回值的类型信息
4. **元数据构建**：构建元数据对象，包含合约的所有结构信息
5. **元数据验证**：验证元数据是否符合DDN合约规范
6. **序列化**：将元数据对象序列化为JSON格式存储

### 2.2 关键代码流程

```
合约源代码 → TypeScript编译器 → ContractCodeParser → ContractMetadataManager → 元数据验证 → 序列化存储
```

在`Compiler.compile`方法中，元数据生成的关键代码如下：

```javascript
// 编译
const compiledCode = this.doCompile(preprocessedCode, (sourceFile, program) => {
  measuring.mark("compile");

  const checker = program.getTypeChecker();
  const checkerResolver = { resolveType: (node) => this._parser.getNodeTypeInfo(node) };

  metadata = this._parser.parseContractMetadata(sourceFile, checkerResolver);
  measuring.mark("parseMetadata");
});
```

## 3. 元数据结构

### 3.1 元数据对象结构

合约元数据对象包含以下主要组成部分：

```javascript
{
  className: string,            // 合约类名
  constVariables: [],           // 常量变量列表
  dataInterfaces: [],           // 数据接口定义列表
  customeTypes: [],             // 自定义状态类型列表
  states: [],                   // 状态变量列表
  methods: []                   // 方法列表
}
```

### 3.2 主要组件详解

#### 3.2.1 常量变量 (constVariables)

定义合约中的常量，只能是基本类型（number, boolean, string, bigint）。

```javascript
{
  name: string,                 // 常量名称
  type: {                       // 类型信息
    name: string,               // 类型名称
    kind: number,               // 类型种类
    text: string                // 类型文本表示
  }
}
```

#### 3.2.2 数据接口 (dataInterfaces)

定义合约中使用的数据结构接口。

```javascript
{
  name: string,                 // 接口名称
  flat: boolean,                // 是否为扁平结构
  properties: [                 // 属性列表
    {
      name: string,             // 属性名
      optional: boolean,        // 是否可选
      type: {                   // 类型信息
        name: string,
        kind: number,
        text: string
      }
    }
  ]
}
```

#### 3.2.3 自定义状态类型 (customeTypes)

定义合约中使用的自定义状态类型。

```javascript
{
  name: string,                 // 类型名称
  flat: boolean,                // 是否为扁平结构
  constructorMethod: {},        // 构造方法信息
  properties: []                // 属性列表
}
```

#### 3.2.4 状态变量 (states)

定义合约的状态变量。

```javascript
{
  name: string,                 // 状态名称
  public: boolean,              // 是否公开
  readonly: boolean,            // 是否只读
  type: {                       // 类型信息
    name: string,
    kind: number,
    text: string
  }
}
```

#### 3.2.5 方法 (methods)

定义合约的方法。

```javascript
{
  name: string,                 // 方法名称
  parameters: [                 // 参数列表
    {
      name: string,             // 参数名
      optional: boolean,        // 是否可选
      type: {}                  // 类型信息
    }
  ],
  returnType: {},               // 返回类型信息
  public: boolean,              // 是否公开
  isConstructor: boolean,       // 是否为构造函数
  payable: boolean,             // 是否可支付
  defaultPayable: boolean,      // 是否为默认支付方法
  constant: boolean             // 是否为常量方法(只读)
}
```

## 4. 元数据验证机制

### 4.1 验证过程

元数据验证由`MetadataVerifier`类负责，主要验证以下方面：

1. 合约类必须存在且命名正确
2. 常量变量必须是基本类型
3. 数据接口成员类型必须合法
4. 自定义状态类型必须符合规范
5. 状态变量类型必须合法且嵌套深度不超过限制
6. 方法签名必须符合规范

### 4.2 主要验证规则

- 常量变量只能是基本类型
- 状态嵌套深度不能超过4层
- 参数和返回值嵌套深度不能超过3层
- 构造函数必须是公开的且无参数
- 可支付方法必须有特定的参数签名
- 常量方法必须是公开的且有返回值
- 不能同时使用payable和constant修饰符

## 5. 元数据存储和使用

### 5.1 存储机制

合约元数据在部署时被序列化并存储在区块链数据库中：

1. 主要存储在`contract`表的`metadata`字段中
2. 备份存储在`contract_result`表的`data`字段中

### 5.2 运行时使用

在合约运行时，元数据被用于：

1. 方法调用验证：验证调用参数是否符合方法签名
2. 状态访问控制：控制状态变量的访问权限
3. 常量方法识别：识别只读方法，不修改状态
4. Gas计算：基于方法复杂度计算Gas消耗

```javascript
// 调用合约方法时使用元数据验证
async callMethod(methodName, args, options = {}) {
  // 获取方法元数据
  const methodMetadata = this._metadata.getMethod(methodName);

  // 检查方法是否存在
  if (!methodMetadata) {
    throw new Error(Messages.Runtime.MethodNotFound.replace('%s', methodName));
  }

  // 检查方法是否公开
  if (!methodMetadata.public) {
    throw new Error(Messages.Runtime.CannotCallNonPublicMethod.replace('%s', methodName));
  }

  // 检查常量方法调用
  if (options.constant && !methodMetadata.constant) {
    throw new Error(Messages.Runtime.CannotCallMethodInConstantContext.replace('%s', methodName));
  }
  
  // ... 其他验证和调用逻辑
}
```

## 6. 元数据API接口

### 6.1 获取合约元数据

**接口地址**：`/api/contracts/meta` 或 `/api/contracts/metadata`

**请求方式**：GET

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
| ----- | ---- | ---- | ---- |
| id | string | 是 | 合约ID |

**返回结果**：

```json
{
  "success": true,
  "metadata": {
    "className": "HelloWorld",
    "methods": [...],
    "states": [...],
    "constVariables": [...],
    "dataInterfaces": [...],
    "customeTypes": [...]
  }
}
```

### 6.2 命令行工具

使用DDN CLI工具获取合约元数据：

```bash
ddn contract meta <合约ID>
```

## 7. 开发注意事项

### 7.1 元数据设计原则

1. **类型安全**：确保所有类型定义明确，避免使用any类型
2. **接口分离**：将复杂数据结构拆分为多个接口
3. **状态简化**：避免过深的状态嵌套，保持状态结构简单
4. **方法明确**：明确区分常量方法和状态修改方法

### 7.2 常见问题和解决方案

1. **元数据验证失败**：检查合约是否符合DDN合约规范
2. **状态嵌套过深**：重构状态设计，减少嵌套层级
3. **方法签名错误**：确保方法参数和返回值类型正确
4. **元数据解析错误**：检查合约语法和类型定义

### 7.3 最佳实践

1. 使用TypeScript接口定义复杂数据结构
2. 为所有公开方法提供明确的参数和返回类型
3. 使用基本类型作为常量变量类型
4. 避免循环引用的类型定义
5. 为状态变量设置合适的访问权限
6. 使用`@readonly`装饰器标记只读方法

## 8. 总结

合约元数据是DDN智能合约系统的核心组成部分，它提供了合约结构的完整描述，支持合约的验证、调用和执行。开发者应当理解元数据的生成和使用机制，遵循DDN合约开发规范，以确保合约的正确性和安全性。
