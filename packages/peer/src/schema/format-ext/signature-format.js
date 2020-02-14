export default {

    name: "signature",

    validate(str) {
        if (str.length == 0) {
            return true;
        }

        try {
            const signature = Buffer.from(str, 'hex');
            return signature.length == 64;
        } catch (e) {
            return false;
        }
    }

};
