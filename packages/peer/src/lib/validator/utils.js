import util from 'util';
export {extend};
export {copy};
export const inherits = util.inherits;

function extend(target, source) {
    if (! target || typeof target !== 'object') return target;

    Array.prototype.slice.call(arguments).forEach(source => {
        if (! source || typeof source !== 'object') return;

        util._extend(target, source);
    });

    return target;
}

function copy(target) {
    if (! target || typeof target !== 'object') return target;

    if (Array.isArray(target)) {
        return target.map(copy);
    } else if (target.constructor === Object) {
        const result = {};
        Object.getOwnPropertyNames(target).forEach(name => {
            result[name] = copy(target[name]);
        });
        return result;
    } else {
        return target;
    }
}
