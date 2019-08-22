一、使用Wrk进行压力测试
-------------------

1. 基本命令

1.1 1000个链接测试

10t x 100c x 5s = 5000

```
wrk -t5 -c100 -d5s -s ./credible/17.benchmark/wrk/tps.lua http://47.92.35.19:8001
```

```
-c, --connections: total number of HTTP connections to keep open with
                   each thread handling N = connections/threads

-d, --duration:    duration of the test, e.g. 2s, 2m, 2h

-t, --threads:     total number of threads to use

-s, --script:      LuaJIT script, see SCRIPTING

-H, --header:      HTTP header to add to request, e.g. "User-Agent: wrk"

    --latency:     print detailed latency statistics

    --timeout:     record a timeout if a response is not received within
                   this amount of time.
```

二、使用Artilly进行压力测试
------------

1. 命令
   ```
   artillery run ./tps.yml
   ```

   基于环境参数的命令：
   ```
   artillery run -e 1k ./tps.yml
   ```
   运行负载为1k/s时的情况

2. 参数
   
3. 报告
