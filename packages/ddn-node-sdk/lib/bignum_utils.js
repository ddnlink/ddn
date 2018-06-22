var BigNumber = require('bignumber.js');

module.exports = {

    /**
     * 实例化一个大数
     */
    new: function() {
        if (arguments.length != 1) {
            throw new Error("必须是一个参数");
        }
        
        return new BigNumber(arguments[0]);
    },

    /**
     * 加法操作
     */
    plus: function() {
        if (arguments.length < 2) {
            throw new Error("至少需要两个参数");
        }

        var result = new BigNumber(0);

        for (var i = 0; i < arguments.length; i++) {
            result = result.plus(new BigNumber(arguments[i]));
        }

        return result;
    },

    /**
     * 减法操作
     */
    minus: function() {
        if (arguments.length < 2) {
            throw new Error("至少需要两个参数");
        }
        
        var result = new BigNumber(arguments[0]);
        for (var i = 1; i < arguments.length; i++) {
            result = result.minus(new BigNumber(arguments[i]));
        }
        return result;
    },

    /**
     * 乘法操作
     */
    multiply: function() {
        if (arguments.length < 2) {
            throw new Error("至少需要两个参数");
        }

        var result = new BigNumber(arguments[0]);
        for (var i = 1; i < arguments.length; i++) {
            result = result.multipliedBy(new BigNumber(arguments[i]));
        }
        return result;
    },

    /**
     * 除法操作
     */
    divide: function() {
        if (arguments.length < 2) {
            throw new Error("至少需要两个参数");
        }

        var result = new BigNumber(arguments[0]);
        for (var i = 1; i < arguments.length; i++) {
            result = result.dividedBy(new BigNumber(arguments[i]));
        }
        return result;
    },

    /**
     * 非数值判断
     */
    isNaN: function() {
        if (arguments.length != 1) {
            throw new Error("必须是一个参数");
        }

        return new BigNumber(arguments[0]).isNaN();
    },

    /**
     * 零判断
     */
    isZero: function() {
        if (arguments.length != 1) {
            throw new Error("必须是一个参数");
        }

        return new BigNumber(arguments[0]).isZero();
    },

    /**
     * 相等判断
     */
    isEqualTo: function() {
        if (arguments.length != 2) {
            throw new Error("必须是两个参数");
        }

        return new BigNumber(arguments[0]).isEqualTo(new BigNumber(arguments[1]));
    },

    /**
     * 大于判断
     */
    isGreaterThan: function() {
        if (arguments.length != 2) {
            throw new Error("必须是两个参数");
        }

        return new BigNumber(arguments[0]).isGreaterThan(new BigNumber(arguments[1]));
    },

    /**
     * 大于等于判断
     */
    isGreaterThanOrEqualTo: function() {
        if (arguments.length != 2) {
            throw new Error("必须是两个参数");
        }

        return new BigNumber(arguments[0]).isGreaterThanOrEqualTo(new BigNumber(arguments[1]));
    },

    /**
     * 小于判断
     */
    isLessThan: function() {
        if (arguments.length != 2) {
            throw new Error("必须是两个参数");
        }

        return new BigNumber(arguments[0]).isLessThan(new BigNumber(arguments[1]));
    },

    /**
     * 小于等于判断
     */
    isLessThanOrEqualTo: function() {
        if (arguments.length != 2) {
            throw new Error("必须是两个参数");
        }

        return new BigNumber(arguments[0]).isLessThanOrEqualTo(new BigNumber(arguments[1]));
    },

    /**
     * 绝对值
     */
    abs: function() {
        if (arguments.length != 1) {
            throw new Error("必须是一个参数");
        }

        return new BigNumber(arguments[0]).absoluteValue();
    },

    /**
     * 取模
     */
    modulo: function() {
        if (arguments.length != 2) {
            throw new Error("必须是两个参数");
        }
        
        return new BigNumber(arguments[0]).modulo(new BigNumber(arguments[1]));
    }

}