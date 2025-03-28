开发环境
-------

本容器预装了 Ubuntu ubuntu:20.04，方便开发、编译和打包。

1. 启动容器
```sh
$ docker-compose up -d
```
2. 进入容器
```sh
$ docker exec -it ddn-dev bash

# 如果使用 docker desktop 进入容器，直接点击对应的容器即可
# 或者使用以下命令进入容器
$ docker exec -it -u root ddn-dev bash

# 切换到 bash 用户
$ bash
```
3. 安装依赖
```sh
$ composer install
```

4. 编译