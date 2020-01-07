module.exports = {

    name: "checkInt",

    validate: function(value) {
        if (isNaN(value) || 
            parseInt(value) != value || 
            isNaN(parseInt(value, 10))) {
            return false;
        }

        value = parseInt(value);
        return true;
    }

};