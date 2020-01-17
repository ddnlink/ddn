# Contribute

## Set up

Clone the repo.

```bash
$ git clone https://github.com/ddnlink/ddn.git
```

Install dev deps after git clone the repo.

```bash
$ cd ddn
$ yarn
```

Bootstrap every package with yarn. (Need to execute when new package is included)

```bash
$ yarn bootstrap
```

Build first.

```bash
$ yarn build
```

Run it.

```bash
$ yarn start
```

or

```bash
$ cd examples/fun-tests
$ yarn start
```

If you watch nothing，please do that

```bash
$ cd examples/fun-tests
$ touch .ddnrc.local.js
```

and then, copy the follow content to `.ddnrc.local.js`

```js
/*---------------------------------------------------------------------------------------------
 *  This is your config local.
 *--------------------------------------------------------------------------------------------*/

module.exports = {
  /**
   * About Peer
  */
  // port: 8001,
  // address: "127.0.0.1",
  // publicIp: "",
  logLevel: "info", // This allows the command line to output more info for development testing
  // netVersion: "testnet"
}
```

## Common Tasks

Monitor file changes and transform with babel.

```bash
$ yarn build --watch
```

Run test.

```bash
# Including e2e test
$ yarn test

# Unit test only
$ yarn test .test.(t|j)s

# Test specified file and watch
$ yarn test getMockData.test.js -w

# Test specified package
$ PACKAGE=ddn-core yarn test

# Don't run e2e test
$ E2E=none yarn test

# Generate coverage
$ yarn test --coverage
```

Publish to npm.

```bash
# Generator the changelog first.
$ yarn changelog

# Do not use yarn for this command.
$ npm run publish
```
