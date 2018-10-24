var options = require('./options');
var { AssetUtils } = require('ddn-asset-base');

var assetPlugins = require('./asset.plugin');

module.exports = {

    init: function(nethash) {
        if (nethash) {
            options.set("nethash", nethash);
        }

        AssetUtils.loadFromObject(assetPlugins);
    }

}