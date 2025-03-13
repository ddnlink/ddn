# Multi Peers 环境

建议使用多节点环境进行开发测试

## 启动(重启) / 关闭 3 个节点

```sh
$ sh ./start_peers.sh
$ sh ./stop_peers.sh
```

## 启动(重启) / 关闭 5 个节点
```sh
$ sh ./start_peers.sh -n 5
$ sh ./stop_peers.sh -n 5

# 强制重新创建并启动 5 个节点
$ sh ./start_peers.sh -n 5 -f 
```

## 清理节点数据
```sh
# 清理3个节点的所有数据（数据库和日志）
$ sh ./clean_peers.sh

# 清理5个节点的所有数据
$ sh ./clean_peers.sh -n 5

# 只清理数据库文件
$ sh ./clean_peers.sh -t db

# 只清理日志文件
$ sh ./clean_peers.sh -t log

# 只清理特定文件
$ sh ./clean_peers.sh -f debug    # 只清理 debug.log
$ sh ./clean_peers.sh -f dvm      # 只清理 dvm.log
$ sh ./clean_peers.sh -f main     # 只清理 main.log
$ sh ./clean_peers.sh -f blockchain # 只清理 blockchain.db
$ sh ./clean_peers.sh -f peer     # 只清理 peer.db
```

## 节点监控
```sh
# 启动节点监控
$ sh ./monitor_peers.sh

# 后台运行监控
$ nohup sh ./monitor_peers.sh > monitor.log 2>&1 &
```

## 节点查看

为了验证上述信息，可以查看节点的日志文件，或者使用 ddn 查看节点状态。

```sh
# 查看节点日志
$ tail -f ./logs/main.log
$ tail -f ./logs/debug.log
$ tail -f ./logs/dvm.log

# 查看节点状态
$ ddn d peerStat -H 127.0.0.1 -P 8004
```

查看浏览器 http://127.0.0.1:8001/api/blocks/getHeight