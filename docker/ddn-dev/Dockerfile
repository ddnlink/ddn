FROM ubuntu:20.04

# 避免 `source not found`
RUN rm /bin/sh && ln -s /bin/bash /bin/sh

WORKDIR /root/ddn

# 安装tzdata
ARG DEBIAN_FRONTEND=noninteractive
ENV TZ=Asia/ShangHai

# 复制并运行安装脚本
COPY install.sh /root/install.sh
RUN chmod +x /root/install.sh
RUN /root/install.sh

# 暴露端口
EXPOSE 8001
EXPOSE 9001