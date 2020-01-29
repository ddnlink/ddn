var ddnCrypto = require("@ddn/ddn-crypto");
var options = require("./options");
var constants = require("./constants");

module.exports = {
    isAddress: function(address) {
        const NORMAL_PREFIX =
            constants.nethash[options.get("nethash")].tokenPrefix; // D
        return ddnCrypto.isAddress(address, NORMAL_PREFIX);
    },

    // TODO: delete it
    isBase58CheckAddress: function(address) {
        return this.isAddress(address);
    },

    generateBase58CheckAddress: function(publicKey) {
        const NORMAL_PREFIX =
            constants.nethash[options.get("nethash")].tokenPrefix; // D

        return ddnCrypto.generateAddress(publicKey, NORMAL_PREFIX);
    }
};
