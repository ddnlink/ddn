# [3.1.0](https://github.com/ddnlink/ddn/compare/v3.0.0...v3.1.0) (2020-01-07)


### Bug Fixes

* **ddn:** fix a warning about promise ([5f8b906](https://github.com/ddnlink/ddn/commit/5f8b906))
* **ddn:** fix a warning about promise ([9a92ebf](https://github.com/ddnlink/ddn/commit/9a92ebf))
* **ddn:** modified the addressUtil and configs ([9c2a232](https://github.com/ddnlink/ddn/commit/9c2a232))
* **ddn-cli:** fix bignum-utils instead of ddn-utils ([6d3d36a](https://github.com/ddnlink/ddn/commit/6d3d36a))
* **ddn-node-sdk:** fix a few bugs about var not being defined ([d65ad07](https://github.com/ddnlink/ddn/commit/d65ad07))
* **packages:** fix some bugs in ddn-utils, ddn-test, and ddn-aob ([e01a79e](https://github.com/ddnlink/ddn/commit/e01a79e))


### Features

* **component:** add scripts and lerna-changelog to project ([0268614](https://github.com/ddnlink/ddn/commit/0268614))
* **ddn-peer:** add a new module ddn-peer and example blockchain ([4f3a5c2](https://github.com/ddnlink/ddn/commit/4f3a5c2))


### improvement

* **ddn-core:** configured according to different environments ([6c717a4](https://github.com/ddnlink/ddn/commit/6c717a4))


### BREAKING CHANGES

* **ddn-peer:** The new chain is built on the core peer and its components.
* **ddn-core:** 可以通过环境变量 `DDN_ENV` 区分不同环境来指定配置


