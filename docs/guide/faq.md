FAQ 常见问题集锦
--------------

# 1. 启动服务

## 1.1 Q: No delegates, reload database or Encountered missing block, looks like node went down during block processing

A: Please restart DDN service a few of times

原因分析：这个可能是 SQLite 的问题，又或者数据非法重启服务出现块丢失现象。重启服务，让其自检之后，再次启动即可。