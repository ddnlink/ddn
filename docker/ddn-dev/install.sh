#!/bin/bash

# 更新源
rm -rf /etc/apt/sources.list.d/*
rm -rf /etc/apt/sources.list
echo 'deb http://mirrors.aliyun.com/ubuntu-ports/ focal main restricted universe multiverse' >> /etc/apt/sources.list
echo 'deb-src http://mirrors.aliyun.com/ubuntu-ports/ focal main restricted universe multiverse' >> /etc/apt/sources.list
echo 'deb http://mirrors.aliyun.com/ubuntu-ports/ focal-security main restricted universe multiverse' >> /etc/apt/sources.list
echo 'deb-src http://mirrors.aliyun.com/ubuntu-ports/ focal-security main restricted universe multiverse' >> /etc/apt/sources.list
echo 'deb http://mirrors.aliyun.com/ubuntu-ports/ focal-updates main restricted universe multiverse' >> /etc/apt/sources.list
echo 'deb-src http://mirrors.aliyun.com/ubuntu-ports/ focal-updates main restricted universe multiverse' >> /etc/apt/sources.list
echo 'deb http://mirrors.aliyun.com/ubuntu-ports/ focal-backports main restricted universe multiverse' >> /etc/apt/sources.list
echo 'deb-src http://mirrors.aliyun.com/ubuntu-ports/ focal-backports main restricted universe multiverse' >> /etc/apt/sources.list

# 安装必要软件包
apt-get update
apt-get install -y vim curl ntp wget git sudo lsof rsync sqlite3 ca-certificates make gcc g++ autoconf automake python3 build-essential

# 安装nvm和Node.js
curl --silent -o- https://gitee.com/mirrors/nvm/raw/v0.39.7/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 20.15.1
nvm alias default 20.15.1
nvm use default

npm install -g pnpm

# 确保 pnpm link -g . 可用，以便本地使用 ddn-cli 命令行工具，最好放在 ~/.bashrc 中
export PNPM_HOME="/root/.pnpm"
export PATH="/root/.pnpm:$PATH"
pnpm config set disable-self-update-check true
pnpm config set registry https://registry.npmmirror.com/
pnpm config set sqlite3_binary_host_mirror https://npmmirror.com/mirrors/sqlite3/