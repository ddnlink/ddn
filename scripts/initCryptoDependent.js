#!/usr/bin/env node

/*
 * @Author: imfly
 * @Email: kubying@foxmail.com
 * @Date: 2024-06-29 20:04:54
 * @Last Modified by: Someone
 * @Last Modified time: 2024-07-17 18:16:37
 * @Description: 将加密包同步到必备的插件
 */

'use strict'
const fs = require('fs')
const path = require('path')

function cloneConstantsToPackage () {
  const pathTo = path.join(__dirname, '..', 'examples', 'fun-tests')
  const sourcePath = pathTo + '/.ddnrc.js'

  const jsSdkPath = path.join(__dirname, '..', 'packages', 'js-sdk')
  const nodeSdkPath = path.join(__dirname, '..', 'packages', 'node-sdk')
  const cryptoPath = path.join(__dirname, '..', 'packages', 'ddn-cli')

  const data = [jsSdkPath, nodeSdkPath, cryptoPath]
  data.map(item => {
    fs.copyFile(sourcePath, item + '/.ddnc.js', (err) => {
      if (err) {
        console.error('拷贝文件时出错:', err)
      } else {
        console.log('文件已成功拷贝到目标文件夹：', item + '/.ddnc.js')
      }
    })
  })
}

cloneConstantsToPackage()
