import ddnCrypto from "@ddn/crypto";
import options from "./options";
import constants from "./constants";

export default {
    isAddress(address) {
        const NORMAL_PREFIX =
            constants.nethash[options.get("nethash")].tokenPrefix; // D
        return ddnCrypto.isAddress(address, NORMAL_PREFIX);
    },

    // TODO: delete it
    isBase58CheckAddress(address) {
        return this.isAddress(address);
    },

    generateBase58CheckAddress(publicKey) {
        const NORMAL_PREFIX =
            constants.nethash[options.get("nethash")].tokenPrefix; // D

        return ddnCrypto.generateAddress(publicKey, NORMAL_PREFIX);
    }
};
