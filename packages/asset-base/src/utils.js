class AssetUtils {
  static loadFromObject (assetPlugins) {
    const assets = {
      transConfigs: [],
      transTypeValues: [],
      transTypeNames: []
    }

    for (const p in assetPlugins) {
      const currAsset = assetPlugins[p]
      if (currAsset) {
        let assetConfig
        try {
          assetConfig = require(`${currAsset}/.ddnrc.js`)
        } catch (error) {
          throw new Error(`The asset extends error: ${currAsset} has no configure .ddnrc.js.`)
        }

        const assetTransactions = assetConfig.transactions

        if (assetTransactions && assetTransactions.length > 0) {
          assetTransactions.forEach(currTrans => {
            if (!(currTrans.name && !/^\s*$/.test(currTrans.name))) {
              throw new Error('The asset extends error: name property required.')
            }
            if (!(currTrans.type && /^[1-9][0-9]*$/.test(currTrans.type))) {
              throw new Error('The asset extends error: type property required.')
            }

            if (assets.transTypeNames[currTrans.type]) {
              throw new Error(`The asset extends error: type ${currTrans.type} is conflicting.`)
            }

            currTrans.package = currAsset

            assets.transConfigs.push(currTrans)
            assets.transTypeValues[currTrans.name] = currTrans // typeValue -> trans.name
            assets.transTypeNames[currTrans.type] = currTrans // typeName -> trans.type
          })
        }
      }
    }

    global.assets = assets
    if (typeof window !== 'undefined') {
      global.assets = window.assets = assets
    }

    return this
  }

  /**
   * 通过一个文件，将全部插件及其交易类型的配置一次性提供
   * 本方法目的是方便前端打包，主要用于 @ddn/node-sdk 使用
   * USING：
   * 
   * export default [
   *    "@ddn/asset-aob": {
   *      transactions: [
              {
                  name: "AobIssuer",
                  type: 60
              },
              {
                  name: "AobAsset",
                  type: 61
              },
              {
                  name: "AobFlags",
                  type: 62
              },
              {
                  name: "AobAcl",
                  type: 63
              },
              {
                  name: "AobIssue",
                  type: 64
              },
              {
                  name: "AobTransfer",
                  type: 65
              }
          ]
   *    }
   * ]
   * @param {configJson} assetPluginsJson 插件详细配置
   */
  static loadFromJson (assetPluginsJson) {
    const assets = {
      transConfigs: [],
      transTypeValues: [],
      transTypeNames: []
    }

    for (const p in assetPluginsJson) {
      const currAsset = assetPluginsJson[p]
      if (currAsset) {
        const assetTransactions = currAsset.transactions

        if (assetTransactions && assetTransactions.length > 0) {
          assetTransactions.forEach(currTrans => {
            if (!(currTrans.name && !/^\s*$/.test(currTrans.name))) {
              throw new Error('The asset extends error: name property required.')
            }
            if (!(currTrans.type && /^[1-9][0-9]*$/.test(currTrans.type))) {
              throw new Error('The asset extends error: type property required.')
            }

            if (assets.transTypeNames[currTrans.type]) {
              throw new Error(`The asset extends error: type ${currTrans.type} is conflicting.`)
            }

            currTrans.package = currAsset

            assets.transConfigs.push(currTrans)
            assets.transTypeValues[currTrans.name] = currTrans // typeValue -> trans.name
            assets.transTypeNames[currTrans.type] = currTrans // typeName -> trans.type
          })
        }
      }
    }

    global.assets = assets
    if (typeof window !== 'undefined') {
      global.assets = window.assets = assets
    }

    return this
  }

  static loadFromFile (file) {
    const assetPlugins = require(file)
    return this.loadFromObject(assetPlugins)
  }

  static getTypeValue (typeName) {
    if (global.assets.transTypeValues[typeName]) {
      return global.assets.transTypeValues[typeName].type
    }
    return -1
  }

  static getTypeName (typeValue) {
    if (global.assets.transTypeNames[typeValue]) {
      return global.assets.transTypeNames[typeValue].name
    }
    return null
  }

  // TODO: 此处与 peer/src/assets/loader.js 的 hasType(trs.type） 相当
  // 尝试重构 kernal/trsaction.js 的 !this._assets.hasType(trs.type）使用
  static isTypeValueExists (typeValue) {
    return !!(global.assets && global.assets.transTypeNames[typeValue])
  }

  static getAssetJsonName (typeValue) {
    let result = ''
    const typeName = `${this.getTypeName(typeValue)}`
    const subNames = typeName.split(/[-_]/)
    for (let i = 0; i < subNames.length; i++) {
      const sn = subNames[i]
      if (sn && !/^\s*$/.test(sn)) {
        if (i === 0) {
          const camelSN = sn.substring(0, 1).toLowerCase() + sn.substring(1)
          result += camelSN
        } else {
          const camelSN = sn.substring(0, 1).toUpperCase() + sn.substring(1)
          result += camelSN
        }
      }
    }
    return result
  }

  static getTransactionCount () {
    return global.assets.transConfigs.length
  }

  static getTransactionByIndex (index) {
    if (index >= 0 && index < global.assets.transConfigs.length) {
      return global.assets.transConfigs[index]
    }
    return null
  }

  static getTransactionByTypeValue (typeValue) {
    return global.assets.transTypeNames[typeValue]
  }

  static getAssetInstanceByName (context, assetName) {
    if (context && assetName) {
      if (context.runtime && context.runtime.transaction) {
        return context.runtime.transaction.getAssetInstanceByName(assetName)
      }
    }
    return null
  }
}

export default AssetUtils
