---
order: 1
id: http-api
title: 简介
sidebar_label: Http api
group:
  title: 2. Http API
  order: 2
---

# DDN HTTP API文档

## **1 API使用说明**   
### **1.1 请求过程说明**   
1.1 构造请求数据，用户数据按照DDN提供的接口规则，通过程序生成签名，生成请求数据集合；       
1.2 发送请求数据，把构造完成的数据集合通过POST/GET等提交的方式传递给DDN；       
1.3 DDN对请求数据进行处理，服务器在接收到请求后，会首先进行安全校验，验证通过后便会处理该次发送过来的请求；       
1.4 返回响应结果数据，DDN把响应结果以JSON的格式反馈给用户，每个响应都包含success字段，表示请求是否成功，成功为true, 失败为false。 如果失败，则还会包含一个error字段，表示错误原因；       
1.5 对获取的返回结果数据进行处理；       

---   

## ** API 目录 **
1. [账户](/api/http-api/account.md)
2. [交易](/api/http-api/transaction.md)
3. [区块](/api/http-api/blocks.md)
4. [受托人](/api/http-api/delegates.md)
5. [节点](/api/http-api/peer.md)
6. [投票](/api/http-api/delegates.md)
7. [二次密码](/api/http-api/signature.md)
8. [多重签名](/api/http-api/multi-signature.md)
9. [节点传输](/api/http-api/transport.md)
10. [网络状态](/api/http-api/network.md)