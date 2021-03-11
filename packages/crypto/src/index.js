// import { getUserConfig, requireFile, mergeConfigs } from '@ddn/core'
// import path from 'path'
// const baseDir = path.resolve(process.cwd(), './')
// const userConfig = getUserConfig({ cwd: baseDir })

// /**
//  * 请在项目根目录 新增 .ddnrc.js 配置文件，或者 config/config.js 等，参考 DDN 配置文档
//  */
// export const config = mergeConfigs({ crypto: 'nacl' }, userConfig)

/**
 * 请将对应网络的 常量文件 拷贝到你的项目的 config 文件夹下
 */
// const constantsFile = path.resolve(process.cwd(), './constants.js')
// const userConstants = requireFile(constantsFile)
// if(config.crypto==='nacl'){
  const str='nacl'
  // export * from `@ddn/crypto-${str}`;
  // import(`@ddn/crypto-${str}`).then((module)=>{
  //   mod=module
  // })
  const crypto=require(`@ddn/crypto-${str}`)
  console.log(crypto)
  module.exports=  crypto

// }else{

// }
