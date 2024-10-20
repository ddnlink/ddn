开发向导
------------

## 开发环境

- [Node.js](http://nodejs.org/en/) 建议使用最新版
- [pnpm] （必须，负责多包管理的安装、发布等）
- turbo  （必须，负责多包管理的任务执行）
- fathe4 （必须，负责打包、编译）
- jest    (必须，负责测试)

## Docker环境

为了打包适应不同环境的软打包，建议使用 Docker 安装对应的环境。我们建议生产环境是 ubuntu 22.04 及以上版本，下面的演示其过程。


安装 Docker，这里就不介绍了，自己去自行去官网学习安装吧。我们默认你熟悉 Docker 了。

### 安装 Ubuntu 22.04

```bash
$ docker pull ubuntu:22.04
```

### 启动容器

这里我们使用的是 ubuntu 22.04 版本，如果你是其他版本的，自行修改镜像名称。另外，一定要使用 -it 选项，否则无法进入交互模式。同时，-v 选项挂载本地 ddn 代码到容器内，方便后续操作。

```bash
$ docker run -d -it -p 8001:8001 -p 8000:8000 --name ddn-starter -v /path/to/ddn:/ddn/mainnet -v /path/to/ddn-starter:/ddn/starter ubuntu:22.04 
```

这样，一个 ubuntu 运行环境就搭建起来了。


### 进入容器

我使用的 Docker Desktop 软件，直接进入 exec 命令进入容器，这样就可以在容器内执行命令了。**不过，一定要注意，这里使用的是 sh 脚本，它与 bash 脚本不同，它没有 source 命令等，如果出现"nvm not found"的错误，大概率就是这个原因**。

当然，你也可以使用下面的命令，进入容器：

```bash
$ docker exec -it ddn-starter /bin/bash
```

这样，在不离开 IDE 编辑器的情况下，就能执行命令了，就行在本地电脑操作 ubuntu 的体验一样。

### 安装依赖

```bash
$ cd ddn
$ yarn install
```

### 常见问题

1. ubuntu 镜像

官方提供的 ubuntu 镜像源，是最小化版本，没有任何常用的命令，比如：vim, git, curl, ping等，非常麻烦。正常情况下，这些东西执行安装即可，一个命令的事情。但是，更要命的是，更新源在国内不好用，所以就变得非常麻烦了。

网上有人提供了解决方法，使用 echo 命令向/etc/apt/sources.list添加更新源：


在更新源之前，先备份一下：

```shell
# 备份
$ cp /etc/apt/sources.list /etc/apt/sources.list.bak

# 执行更新
$ apt update
```

```shell
# 向/etc/apt/sources.list添加清华的源
echo 'deb http://mirrors.tuna.tsinghua.edu.cn/ubuntu/ jammy main restricted universe multiverse' >> /etc/apt/sources.list && \
echo 'deb http://mirrors.tuna.tsinghua.edu.cn/ubuntu/ jammy-updates main restricted universe multiverse' >> /etc/apt/sources.list && \
echo 'deb http://mirrors.tuna.tsinghua.edu.cn/ubuntu/ jammy-backports main restricted universe multiverse' >> /etc/apt/sources.list


# 阿里云 的源，我就使用的这个
echo 'deb http://mirrors.aliyun.com/ubuntu/ jammy main restricted universe multiverse' >> /etc/apt/sources.list && \
echo 'deb-src http://mirrors.aliyun.com/ubuntu/ jammy main restricted universe multiverse' >> /etc/apt/sources.list && \
echo 'deb http://mirrors.aliyun.com/ubuntu/ jammy-security main restricted universe multiverse' >> /etc/apt/sources.list && \
echo 'deb-src http://mirrors.aliyun.com/ubuntu/ jammy-security main restricted universe multiverse' >> /etc/apt/sources.list && \
echo 'deb http://mirrors.aliyun.com/ubuntu/ jammy-updates main restricted universe multiverse' >> /etc/apt/sources.list && \
echo 'deb-src http://mirrors.aliyun.com/ubuntu/ jammy-updates main restricted universe multiverse' >> /etc/apt/sources.list && \
echo 'deb http://mirrors.aliyun.com/ubuntu/ jammy-backports main restricted universe multiverse' >> /etc/apt/sources.list && \
echo 'deb-src http://mirrors.aliyun.com/ubuntu/ jammy-backports main restricted universe multiverse' >> /etc/apt/sources.list
```


**特别注意**：这里遇到过一个非常奇葩的问题，在更新源的过程中，千万不要开启代理，否则会找不到地址，出现“没有签名”、“无法访问”等错误。我就因为这个问题，折腾了很久。

2. 安装依赖

这里我们需要安装 vim, git, curl, wget 等常用命令，以及 nodejs 和 pnpm 等依赖。

```shell
$ apt install -y vim git curl wget
```

3. 安装 node


```shell
# 安装 nvm 
$ curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# 安装 node
$ nvm install 20.13.1

# 安装 pnpm
$ npm install -g pnpm
```

## 运行

1. 持续构建


2. 本地运行


3. 打包


4. 发布