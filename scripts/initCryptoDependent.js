#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

function cloneConStantsToPackage () {
  const pathTo = path.join(__dirname, '..', 'examples', 'fun-tests')
  const dir = pathTo + '/constants'
  const constants = require(dir)
  const crypto = constants.crypto
  const obj = { crypto }
  const jsSdkPath = path.join(__dirname, '..', 'packages', 'js-sdk')
  const nodeSdkPath = path.join(__dirname, '..', 'packages', 'node-sdk')
  const cryptoPath = path.join(__dirname, '..', 'packages', 'ddn')
  const data = [jsSdkPath, nodeSdkPath, cryptoPath]
  data.map(item => {
    const filename = item + '/constants'
    writeFileSync(filename + '.js', obj)
  })
}

function writeFileSync (file, obj) {
  const content = typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2)
  fs.writeFileSync(file, `module.exports=${content}`, 'utf8')
}
cloneConStantsToPackage()
