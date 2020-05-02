import ddnCrypto from "@ddn/crypto";
import options from "./options";
import constants from "./constants";

export default {
    getTokenPreifx() {
        return constants.nethash[options.get("nethash")].tokenPrefix; // D
    },

    isAddress(address) {
        const tokenPrefix = this.getTokenPreifx();
        return ddnCrypto.isAddress(address, tokenPrefix);
    },

    // TODO: delete it
    // isBase58CheckAddress(address) {
    //     return this.isAddress(address);
    // },

    // fixme: 将所有 generateBase58CheckAddress -> generateAddress
    generateAddress(publicKey) {        
        const tokenPrefix = this.getTokenPreifx();
        return ddnCrypto.generateAddress(publicKey, tokenPrefix)
    },

    generateBase58CheckAddress(publicKey) {
        const tokenPrefix = this.getTokenPreifx();
        return ddnCrypto.generateAddress(publicKey, tokenPrefix);
    }
};
