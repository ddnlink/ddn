FROM ubuntu:20.04

# avoid `source not found`
RUN rm /bin/sh && ln -s /bin/bash /bin/sh

WORKDIR /root/ddn

# install tzdata on a ubuntu docker image
ARG DEBIAN_FRONTEND=noninteractive
ENV TZ=Asia/ShangHai

# 更新源 注意不要使用 https 源, 否则会提醒需要证书错误。国外的用户可以注释这里的内容。
RUN rm -rf /etc/apt/sources.list.d/* && \
    rm -rf /etc/apt/sources.list && \
    echo 'deb http://mirrors.aliyun.com/ubuntu-ports/ focal main restricted universe multiverse' >> /etc/apt/sources.list && \
    echo 'deb-src http://mirrors.aliyun.com/ubuntu-ports/ focal main restricted universe multiverse' >> /etc/apt/sources.list && \
    echo 'deb http://mirrors.aliyun.com/ubuntu-ports/ focal-security main restricted universe multiverse' >> /etc/apt/sources.list && \
    echo 'deb-src http://mirrors.aliyun.com/ubuntu-ports/ focal-security main restricted universe multiverse' >> /etc/apt/sources.list && \
    echo 'deb http://mirrors.aliyun.com/ubuntu-ports/ focal-updates main restricted universe multiverse' >> /etc/apt/sources.list && \
    echo 'deb-src http://mirrors.aliyun.com/ubuntu-ports/ focal-updates main restricted universe multiverse' >> /etc/apt/sources.list && \
    echo 'deb http://mirrors.aliyun.com/ubuntu-ports/ focal-backports main restricted universe multiverse' >> /etc/apt/sources.list && \
    echo 'deb-src http://mirrors.aliyun.com/ubuntu-ports/ focal-backports main restricted universe multiverse' >> /etc/apt/sources.list

# 
RUN apt-get update
RUN apt-get install -y vim curl ntp wget git sudo sqlite3 ca-certificates
RUN apt-get install -y make gcc g++ autoconf automake python build-essential

# nvm environment variables
ENV NVM_DIR $HOME/.nvm
ENV NODE_VERSION 20.15.1
RUN mkdir -p $NVM_DIR

# install nvm，node and npm
RUN curl --silent -o- https://gitee.com/mirrors/nvm/raw/v0.39.7/install.sh | bash && \
    source $NVM_DIR/nvm.sh && \
    nvm install $NODE_VERSION && \
    nvm alias default $NODE_VERSION && \
    nvm use default

# add node and npm to path so the commands are available
ENV NODE_PATH $NVM_DIR/v$NODE_VERSION/lib/node_modules
ENV PATH $NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH

EXPOSE 8000
EXPOSE 9000

