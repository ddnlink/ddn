---
id: ddn-mainnet-upgrade
title: 主网节点升级
sidebar_label: Peer upgrade Mainnet
---

# DDN 主网（mainnet）节点安升级

## 1 升级

### 1.1 目前命令行正在更新维护，暂时只支持手动升级

如果您当前运行的版本低于2.0.4,您可以按照以下步骤升级,首先确保服务器上的node版本为v8.17.0

```
# 检查版本
$ node --version # 输出： v8.17
```
如果不是请参考[主网节点安装1.3章节](./peer-install-mainnet#nodeinstall)查看node版本安装


### 1.2 下载并解压

```
# 主网（mainnet）程序下载：
$ wget http://releases.ddn.link/2.0.4/ddn-linux-2.0.4-mainnet.tar.gz

# 解压
$ tar zxvf ddn-linux-2.0.4-mainnet.tar.gz
```

### 1.3 停止旧版的程序

```
# 进入项目根目录
$ cd ~/your/path/ddn-linux-oldVersion-mainnet

# 停止服务
$ ./ddnd stop
```

### 1.4 复制旧版程序的config.json和blockchain.db到解压后的ddn-linux-2.0.4-mainnet的目录下

```
$ cp ~/your/path/ddn-linux-oldVersion-mainnet/config.json ~/your/path/ddn-linux-2.0.4-mainnet/

$ cp ~/your/path/ddn-linux-oldVersion-mainnet/blockchain.db ~/your/path/ddn-linux-2.0.4-mainnet/
```
**注意**：`对于早期的节点用户，强烈建议更新config.json里面的同步节点列表具体请参考`[主网节点安装2.4.2配置可访问的节点](./peer-install-mainnet#configure)

### 1.5 启动程序

```bash
# 进入项目根目录
$ chmod u+x init/*.sh && chmod 755 ddnd && ./ddnd configure # 主要是安装sqlite3/ntp2等依赖包和库

# 因为目前数据较多，程序初始化时间较长，请耐心等待
$ ./ddnd start
```


### 1.6 查看节点日志和运行状态

请参考章节[主网节点安装章节4](./peer-install-mainnet#look)

### 1.7 如果启动后访问`http://yourip:8000/api/blocks/getStatus`出现如下情况

```js
{"success":false,"error":"Error: Invalid block height"}
```
表明程序还在初始化过程中，请耐心等待，无需任何操作

<!-- ### 4.8 如果您是使用node app.js启动程序控制台打印如下

```bash
$ app.js:156 Error: Error: near line 1: database is locked

    at onerror (/worker/ddn3/src/data/dblite/index.js:288:24)
    at Socket.program.stderr.on.data (/worker/ddn3/src/data/dblite/index.js:302:3)
    at emitOne (events.js:116:13)
    at Socket.emit (events.js:211:7)
    at addChunk (_stream_readable.js:263:12)
    at readableAddChunk (_stream_readable.js:250:11)
    at Socket.Readable.push (_stream_readable.js:208:10)
    at Pipe.onread (net.js:601:20) 
```
表明数据库进程没有结束，请耐心等待一段时间，然后重新启动 -->

## 2 常见问题

### 2.1 程序启动未成功

```bash
# 进入项目根目录
# 查看节点运行状态
$ ./ddnd status # 输出 DDN server is not running

```

#### 情形1

使用node app.js启动程序

```bash
$ node app.js

# 控制台输出
app.js:1 DDN started: 0.0.0.0:8000 
/worker/ddn3/build/ddn-linux-2.0.4-mainnet/node_modules/_bindings@1.5.0@bindings/bindings.js:121
        throw e;
        ^

Error: The module '/worker/ddn3/build/ddn-linux-2.0.4-mainnet/node_modules/_ed25519@0.0.4@ed25519/build/Release/ed25519.node'
was compiled against a different Node.js version using
NODE_MODULE_VERSION 57. This version of Node.js requires
NODE_MODULE_VERSION 64. Please try re-compiling or re-installing
...
```
说明node版本不对，需要切换node版本到v8.17.0

#### 情形2

使用node app.js启动程序

```bash
$ node app.js

# 控制台输出
app.js:1 DDN started: 0.0.0.0:8000 
init.js:246 DDN started: 0.0.0.0:8000 
fatal 2020-11-25 01:28:07 048 app.js:156 Error: Error: near line 1: database is locked

    at onerror (/worker/ddn3/src/data/dblite/index.js:288:24)
    at Socket.program.stderr.on.data (/worker/ddn3/src/data/dblite/index.js:302:3)
    at emitOne (events.js:116:13)
    at Socket.emit (events.js:211:7)
    at addChunk (_stream_readable.js:263:12)
    at readableAddChunk (_stream_readable.js:250:11)
    at Socket.Readable.push (_stream_readable.js:208:10)
    at Pipe.onread (net.js:601:20) 
...
```
说明数据库进程未退出，需要等待一段时间，等数据库进程完全退出后重新启动


***`注意，程序升级完成后，尽量删除旧版的代码，释放服务器磁盘空间`***
