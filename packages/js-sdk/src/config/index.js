import _ from 'lodash'
import Debug from 'debug'

import constants_devnet from './constants.dev'
import constants_ddnnet from './constants.ddn'
import defaultConfig from './ddnrc'

const debug = Debug('debug')

/**
 * Initialize SDK configuration
 * @param {Object} [config={}] - Initial configuration overrides (merges with defaults)
 * @param {Object} [constants={}] - Initial constants overrides (merges with defaults)
 * @returns {{config: Object, constants: Object}} Configuration object with getters
 * @example
 *
 * // 1. Init with global configuration (window.DdnJS.config)
 * // In your HTML file
 * <script>
 *   window.DdnJS = window.DdnJS || {};
 *   window.DdnJS.config = {
 *     net: 'testnet',
 *     apiNodes: ['https://api.testnet.ddn.org']
 *   }
 * </script>
 *
 * // In your code
 * import { init } from '@ddn/js-sdk';
 *
 * // 2. Initialize with default config
 * const { config } = init();
 *
 * // 3. Update configuration dynamically
 * init({
 *   net: 'mainnet',
 *   apiNodes: ['https://api.mainnet.ddn.org']
 * });
 *
 * // 4. Init with environment variable (process.env.DDN_CONFIG)
 *
 * // Access configuration
 * console.log(config.net); // 'mainnet'
 */
function init(newConfig = {}) {
    let config = {};

    // Merge with global configuration (window.DdnJS.config)
    // Check if we're in a browser environment
    const isBrowser = typeof window !== 'undefined';

    if (isBrowser) {
        // Handle legacy SDK references
        if (window.jsSdk || window.JsSdk) {
            console.log('Note: window.jsSdk or window.JsSdk has been removed. Please use DdnJS.');
        }

        // Merge with global configuration if available
        if (window.DdnJS && window.DdnJS.config) {
            config = { ...config, ...window.DdnJS.config };
            debug('merged with global DdnJS.config:', config);
        }
    } else {
        // In Node.js environment, we can use environment variables or other config sources
        debug('Running in Node.js environment');
        // We don't throw an error anymore, allowing Node.js usage

        // 从环境变量中获取网络类型
        if (process.env.DDN_NET) {
            debug('Using network from DDN_NET env:', process.env.DDN_NET);
            // 将环境变量中的网络类型存储到临时变量中，稍后合并到配置中
            config.net = process.env.DDN_NET;
        }
    }

    // Merge initial configuration with defaults
    config = { ...defaultConfig, ...config, ...newConfig }

    // Environment variable injection (process.env.DDN_CONFIG)
    if (process.env.DDN_NET) {
        // 确保 DDN_NET 环境变量有最高优先级
        config.net = process.env.DDN_NET;
        debug('Applied DDN_NET environment variable:', config.net);
    }

    if (process.env.DDN_CONFIG && process.env.DDN_CONFIG !== 'undefined') {
        try {
            const envConfig = JSON.parse(process.env.DDN_CONFIG);
            Object.assign(config, envConfig);

            // 如果同时设置了 DDN_NET 和 DDN_CONFIG，确保 DDN_NET 优先
            if (process.env.DDN_NET) {
                config.net = process.env.DDN_NET;
            }
        } catch (e) {
            throw e
        }
    }

    debug('Final merged config:', config)

    // Initialize constants based on the environment variable
    let constants = process.env.DDN_NAME && process.env.DDN_NAME === 'ddn' ? constants_ddnnet : constants_devnet
    constants = { ...constants, ...constants[config.net || "mainnet"] }
    // 删除后更简洁，区分的地方在于创世时间
    delete constants.mainnet
    delete constants.testnet

    return {
        get config() { return config; },
        get constants() { return constants; }
    }
}

// 为了向后兼容，保留 setup 方法
const setup = init;

export { init, setup }
