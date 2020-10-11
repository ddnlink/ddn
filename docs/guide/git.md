---
id: git-process
title: git协作流程
sidebar_label: git-process
---


## 团队内部

1.克隆项目到本地
git clone 项目git地址

如：克隆区块链浏览器项目的命令
git clone  http://git.ebookchain.net/ddn/ddnExplore2.git

2.查看当前分支
git branch


3.查看项目的所有远程分支
git branch -a


4.切换到到远程dev分支
git checkout -b dev origin/dev


5.从dev分支创建本地工作分支user1112（名称可自己定义）
git checkout -b user1112

6.修改完成，将所有修改文件增加到提交区
git add .


7.进行提交，并进行备注
git commit -m '备注内容'


8.拉取最新的代码，注意Dev分支有没有新增内容
git pull


9.合并dev分支代码到本地工作分支
git merge dev

10.如果有冲突，要解决冲突，并重复6、7步操作


11.提交修改到远程dev分支
git push origin dev

12.提交PR申请合并到dev分支

13.接受PR申请合并到Dev分支

14.要发新版本时，将dev分支内容合并到master主分支，并发布

至此，就完成了一次代码的修改和提交完整流程。

新的修改开始时，请重复6～12步。

## 非团队成员，github上提交PR
1. 