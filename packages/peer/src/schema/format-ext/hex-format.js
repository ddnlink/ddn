module.exports = {

    name: "hex",

    validate: function(str) {
        let b = null;
        try {
            b = Buffer.from(str, 'hex');
        } catch (e) {
            return false;
        }

        return b && b.length > 0;
    }

};
