FAQ
-----


1. 在 git cz 进行提交的时候，出现 --no-install is not in the npm registry 错误

原因是 husky 版本过低了，但是简单安装是无效的，需要这样：

```shell
$ pnpm dlx husky install
```

命令很奇特吧