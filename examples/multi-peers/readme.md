# Multi Peers 环境

建议使用多节点环境进行开发测试

## 启动(重启) / 关闭 3 个节点

```sh
$ sh ./start_peers.sh
$ sh ./shutdown_peers.sh
```

## 启动(重启) / 关闭 5 个节点
```sh
$ sh ./start_peers.sh -n 5
$ sh ./shutdown_peers.sh -n 5

# 强制重新创建并启动 5 个节点
$ sh ./start_peers.sh -n 5 -f 
```

## 查看节点状态
```sh
$ ddn d peerStat -H 127.0.0.1 -P 8004
```