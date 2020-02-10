# [3.2.0](https://github.com/ddnlink/ddn/compare/v3.1.0...v3.2.0) (2020-02-10)

### Features

* update to v3.2.0 that delete all the ddn prefix ([c700347](https://github.com/ddnlink/ddn/commit/c700347))
* **ddn-asset-*:** improve DDN asset to make its development configuration simpler ([dc1e902](https://github.com/ddnlink/ddn/commit/dc1e902))
* **ddn-cli:** change command line tools ddn-cli to ddn, and add generating blockchain from template ([d46d3f9](https://github.com/ddnlink/ddn/commit/d46d3f9))
* **ddn-crypto:** add ddn-crypto module to handle all the functions of encryption and decryption ([2c60168](https://github.com/ddnlink/ddn/commit/2c60168))

### improvement

* **ddn-crypto:** change js-nacl to tweetnacl.js etc ([a3ad7ad](https://github.com/ddnlink/ddn/commit/a3ad7ad))

### BREAKING CHANGES

* All modules are in @ddn with no ddn prefix, and command line has the same name ddn.
* **ddn-crypto:** Improved encryption algorithm, unified encryption management and improved
comprehensive performance
* **ddn-crypto:** Focus on Cryptography
* **ddn-cli:** 1. change command line tool ddn-cli to ddn;2. Add new functions

## [3.1.1](https://github.com/ddnlink/ddn/compare/v3.1.0...v3.1.1) (2020-01-16)

### Features

* **ddn-peer:** add a new module ddn-peer and example blockchain ([4f3a5c2](https://github.com/ddnlink/ddn/commit/4f3a5c2))

### BREAKING CHANGES

* **ddn-peer:** The new chain is built on the core peer and its components.

## [3.1.0](https://github.com/ddnlink/ddn/compare/v3.0.0...v3.1.0) (2020-01-07)

### Bug Fixes

* **ddn:** fix a warning about promise ([5f8b906](https://github.com/ddnlink/ddn/commit/5f8b906))
* **ddn:** fix a warning about promise ([9a92ebf](https://github.com/ddnlink/ddn/commit/9a92ebf))
* **ddn:** modified the addressUtil and configs ([9c2a232](https://github.com/ddnlink/ddn/commit/9c2a232))
* **ddn:** fix bignum-utils instead of ddn-utils ([6d3d36a](https://github.com/ddnlink/ddn/commit/6d3d36a))
* **node-sdk:** fix a few bugs about var not being defined ([d65ad07](https://github.com/ddnlink/ddn/commit/d65ad07))
* **packages:** fix some bugs in ddn-utils, test, and asset-aob ([e01a79e](https://github.com/ddnlink/ddn/commit/e01a79e))


### Features

* **component:** add scripts and lerna-changelog to project ([0268614](https://github.com/ddnlink/ddn/commit/0268614))

### Improvement

* **core:** configured according to different environments ([6c717a4](https://github.com/ddnlink/ddn/commit/6c717a4))

### BREAKING CHANGES

* **core:** The config can be specified by distinguishing different environments through the environment variable 'DDN_ENV'
