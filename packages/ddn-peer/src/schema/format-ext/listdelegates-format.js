module.exports = {

    name: "listDelegates",

    validate: function(obj) {
        obj.limit = 101;
        return true;
    }

};