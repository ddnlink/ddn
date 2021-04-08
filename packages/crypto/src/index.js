import { requireFile } from '@ddn/core'
import path from 'path'
// const baseDir = path.resolve(process.cwd(), './')
// const userConfig = getUserConfig({ cwd: baseDir })

// // /**
// //  * 请在项目根目录 新增 .ddnrc.js 配置文件，或者 config/config.js 等，参考 DDN 配置文档
// //  */
// export const config = mergeConfigs({ crypto: 'nacl' }, userConfig)

/**
 * 读取项目根目录下contants.js文件，读取其中的crypto配置
 */
const constantsFile = path.resolve(process.cwd(), './constants.js')
const userConstants = requireFile(constantsFile)
if (!userConstants.crypto) {
  userConstants.crypto = '@ddn/crypto-nacl'
}
const crypto = require(`${userConstants.crypto}`)
module.exports = crypto
