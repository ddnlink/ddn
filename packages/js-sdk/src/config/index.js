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
 * @returns {{config: Object, constants: Object, updateConfig: Function, updateConstants: Function}} Configuration object with getters and update methods
 * @example
 * 
 * // 1. Init with global configuration (window.DdnJS.config)
 * // In your HTML file
 * <script>
 *   window.DdnJS = window.DdnJS || {};
 *   window.DdnJS.config = {
 *     net: 'testnet',
 *     apiNodes: ['URL_ADDRESS *   apiNodes: ['https://api.testnet.ddn.org']
 *   }
 * </script>
 * 
 * // In your code
 * import { setup } from '@ddn/js-sdk';
 * 
 * // 2. Initialize with default config
 * const { config } = setup();
 * 
 * // 3. Update configuration dynamically
 * setup({
 *   net: 'mainnet',
 *   apiNodes: ['https://api.mainnet.ddn.org']
 * });
 * 
 * // 4. Init with environment variable (process.env.DDN_CONFIG)
 * 
 * // Access configuration
 * console.log(config.net); // 'mainnet'
 */
function setup(newConfig = {}) {
    let config = {};

    // Merge with global configuration (window.DdnJS.config)
    if (typeof window === 'undefined') {
        throw new Error('Please use this program in a browser or other front-end environment')
    }
    if (window.jsSdk || window.JsSdk) {
        console.log('Note: window.jsSdk or window.JsSdk has been removed. Please use DdnJS.');
    }
    if (window.DdnJS && window.DdnJS.config) {
        config = { ...config, ...window.DdnJS.config };
        debug('merged with global DdnJS.config:', config);
    }

    // Merge initial configuration with defaults
    config = { ...defaultConfig, ...config, ...newConfig }
    debug('merged config:', config)

    // Environment variable injection (process.env.DDN_CONFIG)
    if (process.env.DDN_CONFIG && process.env.DDN_CONFIG !== 'undefined') {
        try {
            Object.assign(config, JSON.parse(process.env.DDN_CONFIG))
        } catch (e) {
            throw e
        }
    }

    // Initialize constants based on the environment variable
    let constants = process.env.DDN_NAME === 'ddn' ? constants_ddnnet : constants_devnet
    constants = { ...constants, ...constants[config.net || "mainnet"] } 
    // 保留吧
    // delete constants.mainnet
    // delete constants.testnet

    return {
        get config() { return config; },
        get constants() { return constants; }
    }
}

export { setup }
