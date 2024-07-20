FROM ubuntu:22.04

# avoid `source not found`
RUN rm /bin/sh && ln -s /bin/bash /bin/sh

WORKDIR /root/ddn

# install tzdata on a ubuntu docker image
ARG DEBIAN_FRONTEND=noninteractive
ENV TZ=Asia/ShangHai

# 更新源
RUN echo 'deb http://mirrors.tuna.tsinghua.edu.cn/ubuntu/ jammy main restricted universe multiverse' >> /etc/apt/sources.list && \
    echo 'deb http://mirrors.tuna.tsinghua.edu.cn/ubuntu/ jammy-updates main restricted universe multiverse' >> /etc/apt/sources.list && \
    echo 'deb http://mirrors.tuna.tsinghua.edu.cn/ubuntu/ jammy-backports main restricted universe multiverse' >> /etc/apt/sources.list

RUN apt-get update && \
    apt-get install vim curl sqlite3 ntp wget git sudo \
    make gcc g++ autoconf automake python build-essential -y

# nvm environment variables
ENV NVM_DIR $HOME/.nvm
ENV NODE_VERSION 20.15.1
RUN mkdir -p $NVM_DIR

# install nvm
RUN curl --silent -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# install node and npm
RUN source $NVM_DIR/nvm.sh \
    && nvm install $NODE_VERSION \
    && nvm alias default $NODE_VERSION \
    && nvm use default

# add node and npm to path so the commands are available
ENV NODE_PATH $NVM_DIR/v$NODE_VERSION/lib/node_modules
ENV PATH $NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH

EXPOSE 8000
