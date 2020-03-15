---
id: ddn-install
title: 节点安装
sidebar_label: Peer Install
toc: menu
---

## 1.Requirements 系统要求

**必选**

- [*] linux 系统
- [*] 有公网ip

**建议**

- 系统：ubuntu 16.04.03 LTS x64位操作系统
- CPU： 2C以上
- 内存：4G以上
- 带宽：2Mb以上
- 硬盘：40GB以上

## 2 Install 安装

主网(mainnet)默认端口：8000，测试网(testnet)默认8001，安装流程一致。

**PS: 请不要在同一台机器安装多个应用（多个主网或测试网）**

### 2.1 Download 下载

主网mainnet

```
$ wget http://releases.ddn.link/2.0.2/ddn-linux-2.0.2-mainnet.tar.gz
$ tar zxvf ddn-linux-2.0.2-mainnet.tar.gz
```

测试网testnet

```
$ wget http://releases.ddn.link/2.0.2/ddn-linux-2.0.2-mainnet.tar.gz
$ tar zxvf ddn-linux-2.0.2-testnet.tar.gz
```

### 2.2 Preparations 准备工作

PS：主要是安装sqlite3/ntp2等依赖包和库

```
# 进入你的安装目录（cd project folder)
$ cd ~/your/project/

# 在 ubuntu 执行下面的命令
$ chmod u+x init/*.sh && chmod 755 ddnd && ./ddnd configure
```

## 3 Run 运行

```
# 在安装目录
$ cd ~/your/project/

# 启动
$ ./ddnd start

# 停止
$ ./ddnd stop

# 查看运行状态
$ ./ddnd status

# 重启
$ ./ddnd restart

# 查看版本
$ ./ddnd version

# 查看log
$ tail -f logs/debug.log
```

## 4 Delegate 受托人配置

### 4.1 Delegate`s secret 受托人密钥

打开`config.json`, 找到`secret`字段，将`受托人密钥`填进去即可。可配置多个，但不能重复。

```jsx | inline
import React from 'react';
import gif from '../images/delegate-secret.png';

export default () => <img src={gif} width="300" />;
```

PS: 一定要避免重复配置受托人密钥

### 4.2 Public Ip 公网IP

系统会自动检测公网ip，为避免公网ip无法检测到，建议手动在`config.json`修改如下字段：

```
"publicIp": "x.x.x.x",
```

重启程序

```
$ ./ddnd restart
```

## 5 Upgrade 升级

```
$ ./ddnd upgrade
$ ./ddnd restart
```

## 6 查看节点

用区块链浏览器查看节点运行情况

```jsx | inline
import React from 'react';
import gif from '../images/peer_explorer.jpg';

export default () => <img src={gif} width="300" />;
```

## 7 Fault checking 错误诊断

### 7.1 区块链浏览器无法访问

如果出现无法浏览的情况，需要检查如下：

#### 情形1

查看设置是否正确

- 查看是否改了`config.json`里的port字段
- 官方的种子节点将端口改成了`8000`
- 检查防火墙配置，需要打开节点端口入站和出站。

#### 情形2

查看服务是否启动

```
$ ./ddnd status

# 如果没有启动则显示
Ebookhcain server is not running

# 如果出现这种情况，重启即可
$ ./ddnd restart
```

如果无法重启，运行一下下面的命令

```
$ ./ddnd configure

# 然后重新启动
$ ./ddnd start
```

### 7.2 无法生产块 

#### 情形1

查看受托人排名是否进入前101

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

PS： 如果节点正在同步区块，不要立即重启，建议同步完成再重启

```
$ ./ddnd restart
```

正常情况下的log信息

```
$ cat logs/debug.log | grep Forging

Forging enabled on account: xxxxxxxxxxxxxx
```

### 7.3 无法同步

PS： 通过对比自己钱包的区块高度与官方节点的最新区块高度来确认

请尝试使用下面的方式修复

1.重启节点

```
$ ./ddnd restart
```

2.重启无法解决

```
$ ./ddnd rebuild
```
