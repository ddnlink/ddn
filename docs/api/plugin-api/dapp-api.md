---
order: 4
id: ddn-dapp-api
title: 4. DDN Dapp Api
sidebar_label: DDN Dapp Api
---


## 1. 注册Dapp
接口地址：/api/dapp<br/>
请求方式：PUT<br/>
请求参数：<br/>
名称 | 类型 | 说明
-|-|-
secret | string | 注册Dapp的账户私钥
name | string | Dapp名称
category | string | Dapp分类，Common: 1,  Business: 2, Social: 3,  Education: 4,  Entertainment: 5, News: 6,  Life: 7,  Utilities: 8,  Games: 9
type | integer | Dapp类型，0: DAPP，1: FILE
description | string | 描述
tags | string | 标签，多个用逗号分隔
link | string | Dapp程序包链接地址
icon | string | Dapp Logo链接地址
delegates | string | Dapp受托人公钥字符串，多个用逗号分隔
unlock_delegates | integer | 转出操作时，需要几个受托人确认
返回结果：<br/>
注册成功之后返回交易Id

## 2. 分页查询Dapp
接口地址：/api/dapp<br/>
请求方式：GET<br/>
请求参数：<br/>
名称 | 类型 | 说明
-|-|-
type | integer | Dapp类型，0: DAPP，1: FILE
name | string | Dapp名称
category | string | Dapp分类，Common: 1,  Business: 2, Social: 3,  Education: 4,  Entertainment: 5, News: 6,  Life: 7,  Utilities: 8,  Games: 9
link | string | Dapp程序包链接地址
icon | string | Dapp Logo链接地址
sort | string | 查询排序，多个用逗号分隔
pageindex | integer | 分页查询页码，默认1
pagesize | integer | 分页查询每页大小，默认100
返回结果：<br/>
Dapp信息列表<br/>

## 3. 根据Id查询指定Dapp详情
接口地址：/api/dapp/get<br/>
请求方式：GET<br/>
请求参数：<br/>
名称 | 类型 | 说明
-|-|-
id | string | DappId
返回结果：<br/>
指定的Dapp详情<br/>

## 4. 查询所有已安装Dapp的Id
接口地址：/api/dapp/installedIds<br/>
请求方式：GET<br/>
请求参数：<br/>
无<br/>
返回结果：<br/>
所有已安装Dapp的Id<br/>

## 5. 查询所有已安装Dapp的信息
接口地址：/api/dapp/installed<br/>
请求方式：GET<br/>
请求参数：<br/>
无<br/>
返回结果：<br/>
所有已安装的Dapp的详情列表<br/>

## 6. 安装指定Dapp
接口地址：/api/dapp/install<br/>
请求方式：POST<br/>
请求参数：<br/>
名称 | 类型 | 说明
-|-|-
id | string | 要安装的DappId
master | string | 节点Dapp密码
返回结果：<br/>
成功或失败<br/>

## 7. 卸载指定Dapp
接口地址：/api/dapp/uninstall<br/>
请求方式：POST<br/>
请求参数：<br/>
名称 | 类型 | 说明
-|-|-
id | string | 要卸载的DappId
master | string | 节点Dapp密码
返回结果：<br/>
成功或失败<br/>

## 8. 启动指定Dapp
接口地址：/api/dapp/launch<br/>
请求方式：POST<br/>
请求参数：<br/>
名称 | 类型 | 说明
-|-|-
id | string | 要运行的DappId
params | array | 启动参数
master | string | 节点Dapp密码
返回结果：<br/>
成功或失败<br/>

## 9. 获取指定Dapp上次启动时最后的异常信息
接口地址：/api/dapp/launch/lasterror<br/>
请求方式：GET<br/>
请求参数：<br/>
无<br/>
返回结果：<br/>
空或者异常信息<br/>

## 10. 停止指定Dapp的运行
接口地址：/api/dapp/stop<br/>
请求方式：POST<br/>
请求参数：<br/>
名称 | 类型 | 说明
-|-|-
id | string | 要停止运行的DappId
master | string | 节点Dapp密码
返回结果：<br/>
成功或失败<br/>

## 11. 查询正在安装的Dapp列表
接口地址：/api/dapp/installing<br/>
请求方式：GET<br/>
请求参数：<br/>
无<br/>
返回结果：<br/>
返回所有正在安装的Dapp详情列表<br/>

## 12. 查询正在移除中的Dapp列表
接口地址：/api/dapp/removing<br/>
请求方式：GET<br/>
请求参数：<br/>
无<br/>
返回结果：<br/>
返回所有正在删除的Dapp详情列表<br/>

## 13. 查询已启动的Dapp列表
接口地址：/api/dapp/launched<br/>
请求方式：GET<br/>
请求参数：<br/>
无<br/>
返回结果：<br/>
返回所有已启动的Dapp详情列表<br/>

## 14. 查询所有Dapp应用分类信息
接口地址：/api/dapp/categories<br/>
请求方式：GET<br/>
请求参数：<br/>
无<br/>
返回结果：<br/>
Dapp的应用分类信息<br/>

## 15. 查询指定Dapp下所有币种的余额
接口地址：/api/dapp/balances/:dappid<br/>
请求方式：GET<br/>
请求参数：<br/>
名称 | 类型 | 说明
-|-|-
offset | integer | 分页查询起始位置，默认0
limit | integer | 分页查询每页数量，默认100
返回结果：<br/>
指定Dapp下所有的币种余额<br/>

## 16. 查询指定Dapp下指定币种的余额信息
接口地址：/api/dapp/balances/:dappid/:currency<br/>
请求方式：GET<br/>
请求参数：<br/>
无<br/>
返回结果：<br/>
指定币种的余额详情<br/>