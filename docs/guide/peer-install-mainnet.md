---
id: ddn-mainnet-install
title: 主网节点安装
sidebar_label: Peer Install Mainnet
---

# DDN 主网（mainnet）节点安装

**PS: 测试网络节点安装方法，请参考这里：[测试网络节点安装](./peer-install-testnet.md)**

如果没有特别说明，文中所列出的代码，都是需要在 `ubuntu 16.04 64位` 操作系统之下的命令行中运行的 shell 命令，`$` 为命令行提示符，`#` 为注释说明。

## 1 系统环境搭建

### 1.1 系统要求

**必选**

- [*] linux 系统
- [*] 有公网ip

**建议**

- 系统：**ubuntu 16.04.03 LTS x64位操作系统** 本版本没有对其他系统做兼容测试
- CPU： 2C以上
- 内存：4G以上
- 带宽：2Mb以上
- 硬盘：40GB以上

### 1.2 安装依赖

```sh
# 安装依赖包
$ sudo apt-get install curl wget git ntp sqlite3 libssl-dev openssl make gcc g++ autoconf automake python build-essential cron wget -y
```

如果出现 sqlite3 安装失败等问题，请参考下面的`常见问题`。

### 1.3 Node.js 安装<span id='nodeinstall' />

DDN区块链基于`Node.js v8+`开发，推荐使用 v8.17 的系列版本，其他版本可能存在兼容性问题。建议使用 nvm 管理版本：

```sh
# 安装 nvm
$ curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash

# 加载 nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

# 安装 node 和 npm
$ nvm install v8.17.0 

# 如果安装缓慢，可以切换成淘宝源
# $ export NVM_NODEJS_ORG_MIRROR=http://npm.taobao.org/mirrors/node

# 检查版本确认安装是否成功 
$ node --version # 输出： v8.17
```

## 2 安装节点程序

主网(mainnet)默认端口：8000

**PS: 建议不要在同一台机器安装多个节点应用（多个主网或测试网）**

### 2.1 下载并解压

```
# 主网（mainnet）程序下载：
$ wget http://releases.ddn.link/2.0.4/ddn-linux-2.0.4-mainnet.tar.gz

# 解压
$ tar zxvf ddn-linux-2.0.4-mainnet.tar.gz
```

### 2.2 准备工作

```
# 进入安装目录
$ cd ~/your/path/ddn-linux-2.0.4-mainnet

# 在 ubuntu 执行下面的命令
$ chmod u+x init/*.sh && chmod 755 ddnd && ./ddnd configure # 主要是安装sqlite3/ntp2等依赖包和库
```

### 2.3 下载数据库快照并解压

主网数据库较大，不建议从头开始同步。可以下载数据库快照，直接解压后移动db-20201120目录下的blockchain.db到~/your/path/ddn-linux-2.0.4-mainnet根目录下

```bash
# 海外下载
$ wget http://releases.ddn.link/snapshots/db-20201120.tar.gz

# 国内下载，国内用户建议使用下面的下载地址
$ wget http://36.133.121.235/snapshots/db-20201120.tar.gz

# 解压
$ tar zxvf db-20201120.tar.gz

# 移动数据库到项目根目录下
$ mv db-20201120/blcokchain.db ~/your/path/ddn-linux-2.0.4-mainnet/
```

### 2.4 配置节点

本文档默认使用`config.json`,作为配置文件。最新版本的DDN区块链的配置文件有多个，更多关于`配置`的内容，请参考[DDN区块链的配置](./config.md)

打开`config.json`：

```sh
$ vim config.json
```

#### 2.4.1 配置公网IP

打开`config.json`, 找到并修改 publicIp 为自己服务器的公网 IP。系统会自动检测公网ip，为避免公网ip无法检测到，建议手动修改：

```json
 publicIp: "x.x.x.x",
```

#### 2.4.2 配置可访问的节点 <span id="configure" />

找到并修改 peers => list 为可访问的节点 IP。系统会自动从节点中同步数据到当前节点：

```js
  peers: {
    list: [{"ip": "peer.ddn.link", "port": 8000}],
    blackList: [],
    options: {
      timeout: 4000
    }
  },
```

这里的 `list` 建议配置稳定的、长期的节点，并且不建议配置太多，下面的列表足够使用：

```json
list: [
 {"ip": "peer.ddn.link", "port": 8000},
 {"ip": "101.132.34.62", "port": 8000},
 {"ip": "119.23.67.225", "port": 8000}
 ]
```

**注意**：对于早期的节点用户，强烈建议同步更新上面的节点列表。`

#### 2.4.3 配置受托人

在此操作之前，一定要首先申请受托人，并获得投票授权，否则是不会出块的。

打开`config.json`, 找到`secret`字段，将`受托人密钥`填进去即可。**可配置多个，但不能重复**。

```
  forging: {
    secret: [
      "attract viable organ future copy nerve twelve flag smart course unique test",
      "wash property between put split eternal future catch muffin alley clip add",
```

如果配置并同步之后，再配置受托人，需要重启程序：

```
$ ./ddnd restart
```

## 3 运行命令

```
# 进入安装目录
$ cd ~/your/path/ddn-linux-2.0.4-mainnet

# 启动节点
$ ./ddnd start

# 停止节点
$ ./ddnd stop

# 查看运行状态
$ ./ddnd status

# 重启节点
$ ./ddnd restart

# 查看版本
$ ./ddnd version

# 打开生产区块开关（必须首先注册过受托人）
./ddnd enable "your sercret"
```

## 4 查看节点 <span id='look' />

用浏览器查看节点运行情况，在浏览器里输入网址 `http://yourip:8000/api/blocks/getHeight`，应该返回如下信息：

```
{"success":true,"height":"3"}
```

如果出现下面的信息，说明节点在同步中：

```
{"success":fail,"error":"Blockchain is loading"} 
```

也可以使用下面的命令，监听日志信息：

```
# 查看并监听 log
$ tail -f logs/debug.log
```

## 5 常见问题

### 5.1 浏览器无法访问

如果出现无法访问浏览的情况，需要检查如下：

#### 情形1

查看设置是否正确

- 查看是否改了`config.json`里的port、IP等字段
- 测试节点的端口是`8001`
- 检查防火墙配置，需要打开节点端口入站和出站。

#### 情形2

查看服务是否启动

```
$ ./ddnd status

# 如果没有启动则显示
DDN server is not running

# 如果出现这种情况，启动即可
$ ./ddnd start

# 如果无法启动，查看 ddn.pid 文件是否存在，如果存在，直接删除它
$ rm ddn.pid
```

如果无法启动或重启，运行一下下面的命令

```
$ ./ddnd configure

# 然后重新启动
$ ./ddnd start
```

### 5.2 无法生产块 

#### 情形1

查看受托人排名是否进入前 101

#### 情形2

查看错误日志

```
$ cat logs/debug.log | grep Failed
```

如果出现了如下信息

```
Failed to get public ip, block forging MAY not work!
```

说明公网ip没有获取到，需要手动配置，见上面对应部分说明

#### 情形3

搜索错误日志

```
$ cat logs/debug.log | grep error
```

如果出现了如下信息

```
Failed to load delegates: Account xxxxxxxxx not found
```

说明对应账户还没有注册成为受托人，或者没有重启服务，重启服务即可

注： 如果节点正在同步区块，不要立即重启，建议同步完成再重启

```
$ ./ddnd restart
```

正常情况下的log信息

```
$ cat logs/debug.log | grep Forging

Forging enabled on account: xxxxxxxxxxxxxx
```

### 5.3 无法同步

如果网络始终出现上面提到的 `Blockchain is loading` 信息，并查看 log 日志有错误，请尝试使用下面的方式修复

重启节点

```
$ ./ddnd restart
```

重启无法解决

```
$ ./ddnd rebuild
```

### 5.4 系统更新慢，甚至无法下载相关软件包

请，更新系统源。现在的系统，特别是 linux 类的操作系统，早就实现网络化更新和维护了，没有网络，基本上很难满足我们的要求。而多数操作系统，其我们在准备系统环境的时候，可能会出现下载速度慢，软件找不到等问题，这个时候，就要考虑使用国内的软件源。这里主要针对 Ubuntu 操作系统。

#### 5.4.1 备份源列表

Ubuntu配置的默认源并不是国内的服务器，下载更新软件都比较慢。首先备份源列表文件sources.list：

```
# 首先备份源列表
$ sudo cp /etc/apt/sources.list /etc/apt/sources.list_backup
```

#### 5.4.2 打开sources.list文件修改
选择合适的源，替换原文件的内容，保存编辑好的文件, 以阿里云更新服务器为例（可以分别测试阿里云、清华、中科大、163源的速度，选择最快的）：

```
# 打开sources.list文件
$ sudo vim /etc/apt/sources.list
```

编辑/etc/apt/sources.list文件, 在文件最前面添加阿里云镜像源：

```
#  阿里源
deb http://mirrors.aliyun.com/ubuntu/ bionic main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ bionic-security main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ bionic-updates main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ bionic-proposed main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ bionic-backports main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ bionic main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ bionic-security main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ bionic-updates main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ bionic-proposed main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ bionic-backports main restricted universe multiverse
```

#### 5.4.3 刷新列表

```
$ sudo apt-get update
$ sudo apt-get upgrade
```

下载速度瞬间就起飞了。

### 5.5 node-pre-gyp WARN Using request for node-pre-gyp https download 

首先安装下面的软件包，然后再尝试操作

```
$ sudo apt install python g++ node-gyp  node-pre-gyp libsqlite3-dev 
```

### 5.6 sqlite3 安装不成功

首先，按照问题2，安装对应的软件包；然后，采取从源码构建安装的方式：

```
$ npm install sqlite3 --build-from-source  --registry=https://registry.npm.taobao.org
```
### 5.7 nvm无法安装

若无法访问raw.githubusercontent.com，可在/etc/hosts增加如下内容
```
151.101.76.133    raw.githubusercontent.com
```
