module.exports = {

    name: "listQuery",

    validate: function(obj) {
        obj.limit = 100;
        return true;
    }

};