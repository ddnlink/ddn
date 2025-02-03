FAQ
-----



### 1. 在 git cz 进行提交的时候，出现 --no-install is not in the npm registry 错误

原因是 husky 版本过低了，但是简单安装是无效的，需要这样：

```shell
$ pnpm dlx husky install
```

命令很奇特吧

### 1. 区块生成被阻塞问题

**问题描述：**  
节点日志中不断显示 "Skipping block generation - pending block exists" 警告，区块链停滞在某个高度，无法继续生成新区块。例如：
```log
warn 15:32:34.66 block.js:833 (Block.generateBlock) Skipping block generation - pending block exists
```

原因分析：

1. 区块提议(propose)已生成但未获得足够的投票数
2. 当前配置要求投票数(voters)为67个，但实际网络中只能收到61个投票
3. 由于投票数不足以达到共识要求，导致区块无法最终确认
解决方案：

1. 修改 constants.js 中的投票数配置：

```js
module.exports = {
  delegates: 101,
  superPeers: 21,
  voters: 61,        // 修改为实际可获得的投票数
  remoteVoters: 6,
}
```

2. 清理节点缓存：

```shell
# 停止节点
./ddnd stop peer-8002

# 清理区块缓存和pending状态
rm -rf /Users/imfly/projects/DDN/ddn/examples/peer-8002/db/pending*

# 重启节点
./ddnd start peer-8002
```

注意事项：

- 修改配置后必须重启节点才能生效
- 建议在测试网络中先验证修改效果
- 生产环境中需要协调所有节点同时更新配置
- 执行清理操作前请确保已备份重要数据