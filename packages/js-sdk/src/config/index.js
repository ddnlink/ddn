import _ from 'lodash'
import Debug from 'debug'
const debug = Debug('debug')

// DDN Devnet 
import constants_devnet from './constants.dev'
import config_devnet from './ddnrc.dev'

// DDN Mainnet
import constants_ddnnet from './constants.ddn'
import config_ddnnet from './ddnrc.ddn'

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
    let defaultConfig = process.env.DDN_NAME && process.env.DDN_NAME === 'ddn' ? config_ddnnet : config_devnet
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
    }

    // Merge initial configuration with defaults
    config = { ...defaultConfig, ...config, ...newConfig }

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
export const { config, constants } = init();
