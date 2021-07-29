# DDN Test

Test based on jest.

## Use

```
$ cd ddn/
$ yarn test
```

For test files named `a.test.js` in the all packages, 

```
$ yarn test "a.test.js"
```

## Warning
1. If the genesis block is regenerated, you need to change the relevant account in Src / account utils / accounts.ddn.js, otherwise some tests fail.
2. Some constants and configuration options are modified as appropriate, such as transaction fee, etc.
3. You need to start the test node before running the test.