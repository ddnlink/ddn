---
title: 智能合约 # 课程标题
challengeType: 0               # 课程类型，默认为0：理论， 1： 实验
order: 1                       # 序号，以此为当前单元的课程排序
time:  5个小时                  # 学习时长
videoUrl: ''                   # 视频链接地址
prjectUrl: 'https://github.com/' # 源码地址
localeTitle: DDN智能合约       # 本地化标题
---

# DDN智能合约

## 概念

DDN智能合约在形式上类似于面向对象语言中的类，或者js语言中的一个包含数据与方法的对象。智能合约中有用于数据持久化的状态变量，和可以修改状态变量的函数。

DDN的智能合约部署在DDN区块链上，并由DVM（DDN虚拟机）解释执行。智能合约按照typescript语法编写，在部署时编译，并可通过交易调用，通过接口进行查询。

## 智能合约开发环境

DDN智能合约是基于typescript（以下简称ts）裁剪定制而成，是ts的子集，js的超集。因而智能合约的语法遵循ts语法，开发环境与ts相同。
推荐的开发环境如下：

- vs code编辑器
- @ddn/node-sdk
- DDN 测试节点， 参见[节点安装](./peer-install-testnet.zh-CN.md)

## 智能合约开发部署

- 与其他资产类似，合约是链上的一种资产类型，类型编码是11；
- 交易体的asset字段是一个对象，其内容是{ contract: { name: '', desc: '', ...}}；
- name, version, gas_limit, code为必填字段；
- 合约代码由ts语法书写，必须是一个class，并且必须继承超类SmartContract，基本形式应该是这样：

```
// contract: 'HelloWorld.ts'
export class HelloWorld extends SmartContract {
    ...
}

```

- 更多的语法规范请参考DDN智能合约[参考](#智能合约参考)；

### 部署合约
按照格式生成合约交易，通过API广播交易，DDN区块链将处理交易，对合约代码进行编译，然后存储在链上。
详细的调用方法请参考[api文档](../api/contract-api.md)

### 调用合约
合约的调用有两种类型，call和send。二者的区别是：
### call
call只能调用标注了@readonly的方法，也就是未对合约状态进行修改的方法，可通过接口调用，不消耗gas
### send
send只能通过交易进行调用，凡是对合约状态进行了修改，则只能通过send调用。这类方法没有任何标注或标注了@payable，消耗gas。

## 智能合约参考
智能合约在DDN区块链上运行，链上数据是合约运行的基本环境。同时因为合约代码是在沙箱环境下执行，DVM会把必要的链上数据准备好发送到合约上下文。这些数据都是链上数据的拷贝，合约执行不会影响链上数据。

### 合约上下文
合约运行时，DVM预置了blockchain的一些环境数据，比如交易发送者地址、当前块数据、上一块数据、交易数据等。用户在写合约代码时，可以通过msg或this.msg变量引用这些数据。DVM封装的具体数据见下表：

|名称	   |类型       |说明                   |
|------    |-----     |-------------          |
|senderId  |string    | 交易发送者地址          |
|sender    |object    | 交易发送者其他信息      |
|tx        |object    | 交易数据               |
|block     |object    | 块数据                 |
|lastBlock |object    | 前一块数据             |

sender对象：
|名称	           |类型     |说明              |
|------            |-----   |----              |
|username          |string  |                  |
|address           |string  |                  |
|publicKey         |string  |                  |
|second_public_key |string  |                  |
|balance           |string  |                  |

tx交易对象：
|名称	         |类型     |说明         |
|------          |-----   |----         |
|nethash         |string  |             |
|type            |string  |             |
|amount          |string  |             |
|fee             |string  |             |
|recipientId     |string  |             |
|senderPublicKey |string  |             |
|timestamp       |string  |             |

block块数据：
|名称	     |类型   |说明   |
|------      |-----  |----  |
|id          |string |      |
|height      |string |      |
|payloadHash |string |      |
|prevBlockId |string |      |
|miner       |string |      |
|timestamp   |string |      |

lastBlock块数据：
|名称	     |类型   |说明    |
|------      |-----  |----   |
|id          |string |       |
|height      |string |       |
|payloadHash |string |       |
|prevBlockId |string |       |
|miner       |string |       |
|timestamp   |string |       |

### 智能合约代码

DDN智能合约语言是ts语言的子集，因而DDN智能合约代码是一个ts源文件（模块module），其语法结构符合ts代码的一般规范，但有合约特有的约束与限制。

#### 代码结构

一个标准的智能合约与ts的一个module相似，一般包括四个部分：  

- **全局常量**
- **数据类型接口**
- **合约状态类**
- **合约类**  

##### 2.1.2.1. 全局常量

合约文件中可以有多个常量声明，使用`const`关键字声明，**常量只能使用四种简单类型**(`string`、`number`、`bigint`、`boolean`)，不支持包括`object`,`any`等其他类型，例如：

```ts
const DEFAULT_NAME = 'name'
const DEFAULT_INTEVEL = 3 * 1000
```

##### 数据类型接口

合约文件中可以有多个数据类型接口声明，数据类型接口**用于公开方法的参数及返回值**，使用`interface`关键字声明，与ts数据类型接口一致，但有如下限制：

- 成员只能使用简单类型、`Array`、数据接口类型，成员可以是可选的(使用`?`语法声明)
- 不支持联合类型(如`string & number`和`string | number`)
- 如果成员是`Array`，必须指定泛型参数。泛型类型可以是简单类型、`Array`、数据接口类型，泛型类型参数如果本身不是泛型推荐使用简写形式(如：`names: string[]`)
- 数据接口类型的嵌套深度不能超过 3
- 数据接口类型不可以使用泛型定义(不支持`inteface Data<T> {...}`)
- 不支持只读成员(不支持`readonly`)
- 不支持索引访问器

示例：

```ts
interface AddressInfo {
  province: string
  city: string
  street: string
}

interface PersonInfo {
  name: string
  age?: number
  sex: boolean
  address: Address
}

interface PeopleResultInfo {
  count: number
  pepole: PersonInfo[]
}
```

##### 合约状态类

合约文件中可以有多个状态类，**状态类类型用于合约状态**，类似于JAVA的`POJO`，使用`class`关键字声明，有如下限制：

- 成员只能是属性定义或构造函数，属性可以使用简单类型、状态容器、状态类型
  - 状态容器指`Mapping<T>`(类似于`Map<stirng,T>`)或`Vecotr<T>`(类似于`Array<T>`)，状态容器中的数据会自动持久化
- 成员可以是可选的(使用`?`语法定义)，可以初始化默认值。除可选成员外的所有成员属性必须通过默认值或构造器初始化
- 只支持实例成员(不支持`static`)且可见性为公开(`public`可省略)，不支持`private`, `protected`
- 如果成员是状态容器，必须指定泛型参数。泛型类型可以是简单类型、状态容器和状态类型
- 状态类型的嵌套深度不能超过 3 层
- 状态类不可以使用泛型定义(不支持`class State<T> {...}`)
- 不能是抽象类(不支持`abstract`)
- 不支持实现接口(不支持`implements`语法)和继承(不支持`extends`语法)
- 不支持索引访问器
- 不支持只读成员(不支持`readonly`)
- 不支持`getter`和`setter`
- 所有非可选成员必须初始化，可以在声明时初始化或在构造函数中初始化
- 可以声明一个公开的构造函数，**状态类构造函数不能发生异常** 由于状态数据需要从数据库中加载，需要通过无参构造函数初始化(所有的参数都为`undefined`，随后再初始化各个成员属性)。DVM在调用构造函数时不能产生异常，否则会导致合约加载失败

示例：

```ts
class ContractState {
  payTimes: number
  amount: bigint

  constructor() {
    this.payTimes =  0
    this.amount = BigInt(0)
  }
}

class ContractStateDefault {
  payTimes = 0
  amount = BigInt(0)
}

class ContractStateOptional {
  payTimes = 0
  amount?: bigint
}
```

##### 合约类

合约文件中必须**有且仅有一个**合约类，使用`class`关键字定义，合约类必须是`SmartContract`的子类。合约类只允许合约状态和方法两类成员，基本要求如下:

- 使用`export`关键字修饰
- 必须从`SmartContract`直接继承，不支持多重继承
- 不能是泛型类(不能有泛型参数)
- 不能是抽象类(不支持`abstract`)
- 不支持实现接口(不支持`implements`语法)
- 不支持索引访问器
- 不支持`getter`和`setter`
- 只支持实例成员，不支持静态成员(不支持`static`)

合约类中两种成员的具体规范：

- **合约状态**
合约状态是可以自动进行持久化的合约成员属性。开发者只需要给合约的成员属性赋值，引擎会自动把这些状态持久化到区块链中，对于合约状态来说：

  - 类型必须是简单类型、状态类类型、状态容器之一，
  - 如果成员是状态容器，必须指定泛型参数。泛型类型可以是简单类型、状态容器和状态类类型
  - 状态类类型的嵌套深度不能超过 3 层
  - 所有合约状态成员必须初始化，可以在声明时初始化或在构造函数中初始化
  - **状态不可以是可选的**(不可以是`undefined`)
  - 可见性为公开的状态可以通过HTTP接口查询其状态值(见[合约查询接口](../api/http-api/contract.md#智能合约))，非公开状态不可直接查询(可通过查询方法实现查询)

- **合约方法**  
  合约类中的方法都必须是成员方法(不支持`static`)，不支持异步语法(`Promise`、`async/await`)和生成器语法(`generator`)。可分为以下几类

  - 构造器
  - 可调用方法(可见性为公开的普通方法)
  - 资产接收方法(使用`payable`注解)
  - 查询方法(使用`readonly`注解)
  - 内部方法(可见性为非公开的普通方法`private`或`protected`)
  

  这些方法的具体规则：

  **(a)构造器**

  一个合约只能有一个构造器，是合约类的初始化方法，名称必须为`constructor`，仅在合约注册时执行一次。具体要求：

    - 可见性必须是公开
    - 签名必须是`constructor() {...}`，没有参数也没有返回值
    - 可以访问`this.msg`
    - **调用构造器不应产生异常，否则合约无法注册成功**
    - **不可以访问`this.transfer`**，否则会产生异常导致合约无法注册(因为合约注册时，合约账户没有任何资产)

  **(b)可调用方法**

  一个合约可以有多个可调用方法，是合约类中可见性为公开的，且没有注解修饰的成员方法，具体要求如下：

  - 可见性必须是公开，否则外部不可访问
  - 每个参数必须声明明确的类型，参数类型必须是简单类型、`Array`、数据接口类型之一
  - 如果成员是`Array`，必须指定泛型参数。泛型类型可以是简单类型、`Array`、数据接口类型，泛型类型参数如果本身不是泛型推荐使用简写形式(如：`names: string[]`)
  - **不支持可选参数、不支持参数默认值，也不支持展开参数(`...args: string[]`)**
  - 返回值类型同参数类型要求相同，**必须明确声明返回值类型，否则返回值无法从外部获取**
  - 可以访问`this.msg`和`this.transfer`(如合约账户余额不足，则会失败)

  **(c)资产接收方法**

  一个合约可以多个资产接收方法，资产接收方法是使用`payable`注解的公开方法，用于接收调用转入智能合约的资产，要求如下：

    - 可见性必须是公开
    - 前两个参数分别表示金额与资产名称，一般采用 amount 和 currency 命名
      - amount 类型为`bigint`
      - currency 类型必须为`string`
    - `payable`有一个可选参数，类型为`{ default?: boolean }`，用于表示是否是默认的资产接受方法(使用`@payable({ default: true })`注解)。**一个合约中最多只能有一个默认资产接受方法**
    - **默认资产接收方法必须只能有这两个参数，没有返回类型**，普通的资产接收方法可以有额外的参数和返回类型。
    - 可以访问`this.msg`和`this.transfer`(如合约账户余额不足，则会失败)

  **(d)查询方法**

  一个合约可以有多个查询方法，查询方法是使用`readonly`注解的公开方法，用于实现状态查询等只读状态的计算逻辑，具体要求：

    - 可见性必须是公开
    - 必须有返回类型，且必须是简单类型、`Array`、数据接口类型之一
    - **不可访问`this.msg`和`this.transfer`，否则会失败**
    - **只能只读访问状态成员，不能修改状态。否则会失败**

  **(e)内部方法**

  一个合约可以有多个内部方法，可见性为保护(`protected`)或私有(`private`，**推荐**)，具体要求：

    - 可见性必须是保护或私有
    - 不可使用`readonly`、`payable`注解


#### 注解
DVM提供两个注解(装饰器)，@payable和@readonly，其作用与以太坊虚拟机的关键字payable和readonly类似。 
- @payable注解。该注解表明此方法接受外部账户向合约转账（向外部转账或更改其他状态，不用任何标注）。
- @readonly注解。标注@readonly的方法不允许出现能够修改合约状态的代码。 call调用只能针对标注了@readonly的方法。

#### 智能合约其他语法约定

智能合约语言是Typescript语言的子集，除上节描述的结构约定外，其他主要限制如下：  

- 不可以使用引入第三方库
- 不支持`Symbol`
- 不使用`null`、`any`、`never`、`object`、`unknown` 等类型，`undefined`可以使用
- 不使用交叉类型(如`string & number`)和联合类型(如`string | null`)作为公开方法的参数或返回类型
- 不支持生成器和异步语法(不使用`Promise`、`async/await`)
- 不使用强制类型转换(不使用`<string>name`及`name as string`)
- 一个合约文件只能有一个合约类，这个类必须从`SmartContract`继承而来
- 不可以定义全局函数、静态函数
- 智能合约中只能使用合约引擎提供的内置类型、方法和对象，未提供的原Node.js内置的对象、函数或类型是不可用的(如`Function`、`Date`都是不可用的)
- 私有或保护方法的参数和返回值的定义比较灵活，但请谨慎使用。尽可能避免不确定性
- 合约中不允许使用`try...catch`语法，也不允许使用`throw`语句。任何时候抛出异常(如使用`assert`语句)即导致中止合约
- 可调用方法和查询方法参数和返回值的额外要求
  - 由于合约调用时所有参数会被序列化为`JSON`传递，故只支持可序化的类型(可参考数据接口类的定义)基于效率考虑，全部参数或返回值序列化后的`JSON`字符串长度应控制在`32K`以内(`length <= 32,767`)
  - 查询方法必须声明返回类型，对于可调用方法，如果未声明返回值类型，返回值将被丢弃(不作为调用结果返回)
- 状态类型和数据接口类嵌套深度不超过**3**
  由于状态容器类型的值可以是状态容器类型或合约状态类型，而状态类型中也可以有状态类型或状态容器(数据接口类似)。基于代码可读性以及状态管理的性能考虑。嵌套的深度不应超过3，如`Mapping<bigint>`深度称为 1，`Vector<Mapping<number>>`深度为2；简单自定义类型本身深度为1，包含一个深度为1的容器类型或自定义状态类型深度为2；以此类推
- 注意，**与以太坊的solidity不同**的是，在solidity中，给存储状态赋值会导致自动的复制。而在DDN智能合约中，状态容器或自定义状态中使用的是对象的引用。这样的好处是性能更好、编程更灵活、更符合主流语言的习惯，但也会带来一个问题：当两个状态容器中保存相同的对象引用时，可能会导致误操作。合约引擎会自动检查这种情况的存在，当尝试把一个已经属于合约状态一部分的对象赋值给合约状态时，会抛出异常。

#### 2.1.1. 一个简单智能合约样例

```ts
const CURRENCY = 'DDN'
const EMPTY_ADDRESS = ''
const MAX_AMOUNT = BigInt(1000 * (10 ** 8))

// 自定义状态类型
class PayState {
  // 转账次数
  payTimes: number
  // 转账总额
  amount: bigint
  constructor() {
    this.payTimes = 0
    this.amount = BigInt(0)
  }
}

// 数据接口类型
interface MaxAmountInfo {
  address?: string
  amount?: bigint
  payTimes?: number
}

// 合约类
export class TestContract extends SmartContract {
  // 合约收到的转账, 公开属性
  payStateOfAddress: Mapping<PayState>
  
  // 最大转账的地址，私有状态，外部不可查询
  private maxAmountAddress = EMPTY_ADDRESS
  // 收到的转账总额
  private total = BigInt(0)

  // 初始化方法
  constructor() {
    super()
    this.payStateOfAddress = new Mapping<PayState>()
    this.total = BigInt(0)
  }

  // 默认向合约转账自动调用的方法
  @payable({ isDefault : true })
  onPay(amount: bigint, currency: string) {  
    assert( currency === AVAIBLE_CURRENCY, `Support ${CURRENCY} only` )
    assert( amount > 0 && amount < MAX_AMOUNT , `Amount should greater than 0 and less than ${MAX_AMOUNT}`)

    const address = this.context.senderAddress
    const newAmount = this.payDDN(amount, address)
    if (this.getMaxAmount() < newAmount) {
      this.maxAmountAddress = address
    }
  }

  @readonly
  getMaxInfo(): MaxAmountInfo {
    const address = this.maxAmountAddress
    if (address === EMPTY_ADDRESS) return { }

    const { payTimes, amount } = this.payStateOfAddress[address]!
    return { address, payTimes, amount }
  }

  @readonly
  getTotal(): bigint {
    return this.total
  }

  // 内部方法，外部不可访问（下同）
  private payDDN(amount: bigint, address: string) : bigint {
    let payState = this.payStateOfAddress[address]
    if (!payState) {
      payState = new PayState()
      this.payStateOfAddress[address] = payState
    }

    payState.payTimes += 1
    payState.amount += amount
    this.total += amount

    return payState.amount
  }

  private getMaxAmount() : bigint {
    return (this.maxAmountAddress === EMPTY_ADDRESS) ?
      BigInt(0) :
      this.getPayInfo(this.maxAmountAddress).amount
  }

  private getPayInfo(address: string) : PayState {
    return this.payStateOfAddress[address] || new PayState()
  }
}
```

上述合约代码实现了一个简单的智能合约，这个合约的功能是接收转账并记录下转账人转账次数和转账总额，同时记录下最大的转账人地址。熟悉Typescript/Javascript/C#/Java等语言的开发者可以会发现读起来几乎没有障碍，非常容易理解。下面我们来详细了解一下这个合约的结构和约定：

### 2.2. 内置对象

#### 2.2.1 内置类型

##### 2.2.1.1. 简单类型  

简单类型为`number`、`bigint`、`string`和`boolean`，这四种类型的行为与Javascript/Typescript环境中的行为是一致的。  

##### 2.2.1.2. 状态容器类型(`Mapping`、`Vector`)  

- `Mapping`的行为与以太坊solidity中的`mapping`接近，类似Javascript中的`Object`，是一个可以通过`key`以下标方式来访问的对象容器
- `Vector`的行为与以太坊solidity中的`Array`接近，只可以在最后`push`或`pop`或通过下标(**下标必须0或正整数**)访问的数组
- 状态容器类型包含一个泛型参数，用于指定容器中的值的类型，如`Mapping<bigint>`、`Vector<string>`、`Mapping<User>`。泛型参数可以是简单类型、状态容器类型或状态类型。

##### 2.2.1.3. 其他内置类型

- `SmartContract`
  `SmartContract`是智能合约类的基类，包括两个重要的成员：`msg`属性和`transfer`方法  
  - `msg`属性，是合约调用时环境参数信息。包括三个成员：
    - `tx`对象，包含合约调用的交易相关信息
    - `block`对象，待打包区块信息
    - `lastBlock`对象，包括上一区块的区块头信息
    - `senderId` 属性，调用者的地址
    - `sender`对象，包括调用者的相关信息

    **请注意，如果在合约中使用了：`block` 对象 与`lastBlock`对象。请一定要了解，调用合约时的这两个对象，与合约被打包到区块中的结果不一定一致。因为在调用时，这两个对象是当前节点根据共识机制推测的结果，不代表最终打包到区块中的结果。**

  - `transfer`方法，原型为：

    ```ts
    function transfer(toAddress: string, amount: bigint, currency: string): void
    ```  

    该方法可以实现将合约账户的余额转账到指定的账户地址中，该余额记录在DDN链的区块链数据库中，可以通过DDN链接口进行查询。参数信息如下
    - `toAddress` 类型为`string`，接收人地址
    - `amount` 类型为`bigint`，转账金额
    - `currency`类型为`string`，资产名称

- `ArrayBuffer`
  同Node.js中的`ArrayBuffer`
- `BufferView`
  同Node.js中的`BufferView`
- `Array`
  同Node.js中的`Array`

#### 2.2.2. 工具类/函数

- **`assert`函数**，原型为：

```ts
function assert(condition: boolean, error: string): void
```

该函数合约方法中使用，用来检查合约执行的前置条件是否满足，如条件不满足(`condition === fasle`)会抛出异常，导致合约终止。

- **`log`函数**，原型为：

```ts
function log(...args: any[]): void
```

该函数用于输出调试日志 (请在节点的配置文件`config.json`中的日志级别设置成'debug'，否则日志不显示)，日志位于`logs/contracts/log_yyyyMMdd.log`

- **内置工具类**  
 主要包括如下类与命名空间，除`Crypto`和`util`外，基本与原生功能保持一致：
  - `Array`
  - `ArrayBuffer`
  - `BufferView`
  - `String`
  - `Number`
  - `Object`
  - `Math`
  - `Bigint`
  - `Crypto`  
  - `Util`

工具类及函数的详细说明请参见《Gas计费与内置函数》

### 2.3. 编程规范

编写智能合约代码对可读性和安全性要求比普通的程序要高很多，所以编写一个好的智能合约不仅要求语法正确可以正常编译运行。更多需要考虑可维护性、可验证、安全性等问题，应遵循通用的高维护性、高安全性要求的软件开发规范及模式。下述内容是一些相对特殊的约定：

- 使用[契约式开发](https://en.wikipedia.org/wiki/Design_by_contract)的理念来编写合约代码，任何操作之前应检查前置条件是否成立(使用`assert`函数)。所有的前置条件都检验通过再执行逻辑、修改状态。
- 尽管DDN智能合约平台的每个合约方法的执行是原子的，我们仍然需要遵循先修改状态再调用转账这种顺序来编写代码(代价越高的操作越靠后)。
- ***避免在合约中发行资产，而使用DDN内置的发行资产功能***。这是DDN智能合约和以太坊智能合约一个重要的区别。在以太坊中一般在合约中发行资产，状态记录在合约中。而DDN链上，资产作为第一位概念。链上拥有标准的数字资产发行接口，可以通过图形化的操作快速、安全的发行数字资产；这样发行的数字资产可以用标准的转账接口进行转账，也可以通过区块链浏览器查询相应的交易。
- 合约类型可以有一个无参的构造函数(可省略)
  该方法仅在合约初始化时调用一次，一般在此函数中完成合约状态的初始化工作。虽然可以通过普通合约方法配合`context.senderAddress`实现状态的初始化，但使用构造函数的语义更易于理解。
- 可接受转账的方法，原型为

  ```ts
  @payable({ defalut: true })
  function payableMethod(amount: bigint, currency: string): void
  ```

  **注：**`@payable`注解中的参数`{ defalut: true }`是可选的(默认是`false`)，上例所示的是默认转账接收函数(向合约转账时不指定接收方法时默认的接收方法)。开发者应在合约中存储转入合约的资产数额，这样可以在合约内部确定合约账户本身的余额，避免在调用`transfer`时导致余额不足而失败。

- 合约对象本身、合约内部状态和内置对象皆是不可扩展的，增加、修改、删除属性会产生异常
- 建议使用内部方法封装低层次的实现细节，外部可访问合约代码中应是统一的高逻辑层次的合约代码
- 一个合约方法应当是易于理解和验证，一般一个合约方法的[循环复杂度](https://en.wikipedia.org/wiki/Cyclomatic_complexity#Definition)应控制在10以内，且有效内容不宜超过15行
- 除合约类外，不使用`export`语句，尽管语法上不会出错
- 不使用`public`，因为缺省可见性为`public`；使用`private`而不是`protected`，因为`private`更语义化
- 合约类的构造函数必须是没有参数的，构造函数用于合约初始化，仅在合约注册时被引擎自动调用。尽管可以使用缺省的构造函数，但最好显式的声明一个
- 尽管智能合约引擎支持复杂状态类型的嵌套(嵌套深度不可超过3)，请尽量减少这么做，因为可读性会因些而大大降低
- 智能合约代码应是可读性高、结果确定性高的的代码，避免实现过于灵活的功能。如：在一个众筹合约中，应该在构造函数中初始化众筹的币种、数量、有效期和成功条件等，这些条件不应是动态的
- 涉及数字资产等可能值比较大的数值时，尽可能使用`bigint`,ECMA的标准中采用IEEE-754标准来处理`number`(请参见[ECMA262](http://www.ecma-international.org/ecma-262/6.0/))，存在最大值限制(`Number.MAX_SAFE_INTEGER` = 9,007,199,254,740,991，约 9 X 10^15 )和浮点精度问题(请参见[IEEE754 wiki](https://en.wikipedia.org/wiki/IEEE_754) )

## 3. Gas 计费

对智能合约的计费相关主要包括三个方面，分别是：  

- 合约代码运行所需要的Gas，每一行代码会根据代码的不同进行计费，如：

  ```ts
  const amount = 200
  ```  

  上述代码是一个声明变量变赋值的语句，需要消耗3个Gas。
- 内置函数所需要消耗的Gas，不同的函数需要消耗的Gas数量不完全相同。
- 存储合约状态(包括合约代码保存)所消耗的存储资源所消耗的Gas。  
  具体计费规则细节请参见[Gas计费表](./gas计费表.md)。


