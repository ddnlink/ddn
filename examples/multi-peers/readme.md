# Multi Peers 环境

建议使用多节点环境进行开发测试

## 启动(重启) / 关闭 

```sh
# 启动/重启 3 个测试节点
$ sh ./start_peers.sh
$ sh ./stop_peers.sh

## 启动(重启) / 关闭 5 个测试节点
$ sh ./start_peers.sh -n 5
$ sh ./stop_peers.sh -n 5

# 强制重新创建并启动 5 个测试节点
$ sh ./start_peers.sh -n 5 -f 
```

对于主网节点，可以使用以下命令创建， 之后的重启和停止，都按照上面的命令即可，也就是说代码只要存在就不再需要 -s 和 -m 参数了。

```sh
# 创建并启动 5 个主网节点，节点 24 个受托人
$ sh start_peers.sh -n 5 -s 24 -m mainnet
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
$ ddn d peerStat -H 127.0.0.1 -P 8001
$ ddn d peerStat -H 117.78.45.44 -P 8000 -M
```

查看浏览器 http://127.0.0.1:8001/api/blocks/getHeight

## FAQ

1. 如果出现 `Error: listen EADDRINUSE: address already in use :::8001` 错误，说明端口已经被占用，需要修改端口号。
2. 如果出现 Sandbox is not ready 错误，最可能是数据库初始化中出现问题，拷贝一个 blockchain.db 过来即可。