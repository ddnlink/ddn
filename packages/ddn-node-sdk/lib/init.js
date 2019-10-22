var options = require('./options');
var { AssetUtils } = require('@ddn/ddn-asset-base');

var assetPlugins = require('../config.asset');

module.exports = {

    init: function(nethash) {
        if (nethash) {
            options.set("nethash", nethash);
        }

        AssetUtils.loadFromObject(assetPlugins);
    }

}