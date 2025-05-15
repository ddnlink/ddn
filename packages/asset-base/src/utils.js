class AssetUtils {
  /**
   * Loads asset plugins and registers their transaction types
   * 
   * Asset Plugin Structure:
   * {
   *   "@ddn/asset-example": {
   *     transactions: [
   *       {
   *         name: "ExampleTx",  // Unique string identifier (required)
   *         type: 1001,         // Unique positive integer (required)
   *         // ...other config
   *       }
   *     ]
   *   }
   * }
   * 
   * @param {Object} assetPlugins - Key-value map of asset plugin configurations
   */
  static async loadFromObject(assetPlugins) {
    // Initialize asset registry with empty collections
    const assets = {
      transConfigs: [],       // Array of raw transaction configs
      transTypeValues: [],   // Map: transaction name => config
      transTypeNames: []     // Map: transaction type => config
    }

    // Process each plugin in the assetPlugins map
    for (const p in assetPlugins) {
      const currAsset = assetPlugins[p]

      if (currAsset) {
        let asset
        try {
          // Load plugin module using Node.js require
          asset = require(`${currAsset}`)
        } catch (error) {
          throw new Error(`The asset extends error: ${currAsset} not found.`)
        }

        // Extract transactions array from plugin's default export
        const assetTransactions = asset.default?.config?.transactions

        // Validate plugin structure
        if (!assetTransactions) {
          console.log(`The asset extends error: ${currAsset} has no valid config or transactions. Skipping this plugin.`)
          continue
        }

        // Process valid transactions
        if (assetTransactions.length > 0) {
          assetTransactions.forEach(currTrans => {
            // Validate transaction name format
            if (!(currTrans.name && !/^\s*$/.test(currTrans.name))) {
              throw new Error('The asset extends error: name property required.')
            }

            // Validate transaction type format (positive integer)
            if (!(currTrans.type && /^[1-9][0-9]*$/.test(currTrans.type))) {
              throw new Error('The asset extends error: type property required.')
            }

            // Check for type conflicts across all registered assets
            if (assets.transTypeNames[currTrans.type]) {
              throw new Error(`The asset extends error: type ${currTrans.type} is conflicting.`)
            }

            // Store package reference and register transaction
            currTrans.package = currAsset
            assets.transConfigs.push(currTrans)
            assets.transTypeValues[currTrans.name] = currTrans
            assets.transTypeNames[currTrans.type] = currTrans
          })
        }
      }
    }

    // Initialize global registry
    assets.transactions = []
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
  static loadFromJson(assetPluginsJson) {
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

    assets.transactions = []
    global.assets = assets
    if (typeof window !== 'undefined') {
      global.assets = window.assets = assets
    }

    return this
  }

  // fixme: 该方法未使用 imfly 2024.7.26
  static async loadFromFile(file) {
    const assetPlugins = await import(file)
    return await this.loadFromObject(assetPlugins)
  }

  static getTypeValue(typeName) {
    if (global.assets.transTypeValues[typeName]) {
      return global.assets.transTypeValues[typeName].type
    }
    return -1
  }

  static getTypeName(typeValue) {
    if (global.assets.transTypeNames[typeValue]) {
      return global.assets.transTypeNames[typeValue].name
    }
    return null
  }

  // TODO: 此处与 peer/src/assets/loader.js 的 hasType(trs.type） 相当
  // 尝试重构 kernal/trsaction.js 的 !this._assets.hasType(trs.type）使用
  static isTypeValueExists(typeValue) {
    return !!(global.assets && global.assets.transTypeNames[typeValue])
  }

  /**
   * 根据资产类型值获取对应的JSON属性名
   * 
   * 该方法将资产类型名称转换为驼峰命名的JSON属性名
   * 
   * @param {number} typeValue - 资产类型值
   * @returns {string} 转换后的JSON属性名
   * 
   * @example
   * // 假设typeValue为60，对应的资产类型名称为"aob-issuer"
   * const jsonName = AssetUtils.getAssetJsonName(60);
   * console.log(jsonName); // 输出: "aobIssuer"
   * 
   * @example
   * // 假设typeValue为61，对应的资产类型名称为"aob_asset"
   * const jsonName = AssetUtils.getAssetJsonName(61);
   * console.log(jsonName); // 输出: "aobAsset"
   */
  static getAssetJsonName(typeValue) {
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

  static getTransactionCount() {
    return global.assets.transConfigs.length
  }

  static getTransactionByIndex(index) {
    if (index >= 0 && index < global.assets.transConfigs.length) {
      return global.assets.transConfigs[index]
    }
    return null
  }

  static getTransactionByTypeValue(typeValue) {
    return global.assets.transTypeNames[typeValue]
  }

  static getAssetInstanceByName(context, assetName) {
    if (context && assetName) {
      if (context.runtime && context.runtime.transaction) {
        return context.runtime.transaction.getAssetInstanceByName(assetName)
      }
    }
    return null
  }
}

export default AssetUtils
