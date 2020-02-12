import BigNumber from 'bignumber.js';

export default {

    /**
     * 实例化一个大数
     */
    new(...args) {
        if (args.length != 1) {
            throw new Error("必须是一个参数");
        }

        return new BigNumber(args[0]);
    },

    /**
     * 加法操作
     */
    plus(...args) {
        if (args.length < 2) {
            throw new Error("至少需要两个参数");
        }

        let result = new BigNumber(0);

        for (let i = 0; i < args.length; i++) {
            result = result.plus(new BigNumber(args[i]));
        }

        return result;
    },

    /**
     * 减法操作
     */
    minus(...args) {
        if (args.length < 2) {
            throw new Error("至少需要两个参数");
        }

        let result = new BigNumber(args[0]);
        for (let i = 1; i < args.length; i++) {
            result = result.minus(new BigNumber(args[i]));
        }
        return result;
    },

    /**
     * 乘法操作
     */
    multiply(...args) {
        if (args.length < 2) {
            throw new Error("至少需要两个参数");
        }

        let result = new BigNumber(args[0]);
        for (let i = 1; i < args.length; i++) {
            result = result.multipliedBy(new BigNumber(args[i]));
        }
        return result;
    },

    /**
     * 除法操作
     */
    divide(...args) {
        if (args.length < 2) {
            throw new Error("至少需要两个参数");
        }

        let result = new BigNumber(args[0]);
        for (let i = 1; i < args.length; i++) {
            result = result.dividedBy(new BigNumber(args[i]));
        }
        return result;
    },

    /**
     * 非数值判断
     */
    isNaN(...args) {
        if (args.length != 1) {
            throw new Error("必须是一个参数");
        }

        return new BigNumber(args[0]).isNaN();
    },

    /**
     * 零判断
     */
    isZero(...args) {
        if (args.length != 1) {
            throw new Error("必须是一个参数");
        }

        return new BigNumber(args[0]).isZero();
    },

    /**
     * 相等判断
     */
    isEqualTo(...args) {
        if (args.length != 2) {
            throw new Error("必须是两个参数");
        }

        return new BigNumber(args[0]).isEqualTo(new BigNumber(args[1]));
    },

    /**
     * 大于判断
     */
    isGreaterThan(...args) {
        if (args.length != 2) {
            throw new Error("必须是两个参数");
        }

        return new BigNumber(args[0]).isGreaterThan(new BigNumber(args[1]));
    },

    /**
     * 大于等于判断
     */
    isGreaterThanOrEqualTo(...args) {
        if (args.length != 2) {
            throw new Error("必须是两个参数");
        }

        return new BigNumber(args[0]).isGreaterThanOrEqualTo(new BigNumber(args[1]));
    },

    /**
     * 小于判断
     */
    isLessThan(...args) {
        if (args.length != 2) {
            throw new Error("必须是两个参数");
        }

        return new BigNumber(args[0]).isLessThan(new BigNumber(args[1]));
    },

    /**
     * 小于等于判断
     */
    isLessThanOrEqualTo(...args) {
        if (args.length != 2) {
            throw new Error("必须是两个参数");
        }

        return new BigNumber(args[0]).isLessThanOrEqualTo(new BigNumber(args[1]));
    },

    /**
     * 绝对值
     */
    abs(...args) {
        if (args.length != 1) {
            throw new Error("必须是一个参数");
        }

        return new BigNumber(args[0]).absoluteValue();
    },

    /**
     * 取模
     */
    modulo(...args) {
        if (args.length != 2) {
            throw new Error("必须是两个参数");
        }

        return new BigNumber(args[0]).modulo(new BigNumber(args[1]));
    },

    /**
     * 最接近的较小整数
     */
    floor(...args) {
        if (args.length != 1) {
            throw new Error("必须是一个参数");
        }

        return new BigNumber(args[0]).integerValue(BigNumber.ROUND_FLOOR);
    },

    /**
     * 最接近的较大整数
     */
    ceil(...args) {
        if (args.length != 1) {
            throw new Error("必须是一个参数");
        }

        return new BigNumber(args[0]).integerValue(BigNumber.ROUND_CEIL);
    },

    /**
     * 乘方 POW
     * 返回bigNumber对象
     */
    pow(...args) {
        if (args.length != 2) {
            throw new Error("必须是两个参数");
        }

        return new BigNumber(args[0]).pow(args[1]);
    },

    /**
     * 将byte数组转成16进制大数值
     */
    fromBuffer(buf, opts) {
        if (!opts) opts = {};

        const endian = { 1 : 'big', '-1' : 'little' }[opts.endian] || opts.endian || 'big';

        const size = opts.size === 'auto' ? Math.ceil(buf.length) : (opts.size || 1);
        if (buf.length % size !== 0) {
            throw new RangeError(`Buffer length (${buf.length}) must be a multiple of size (${size})`
            );
        }

        const hex = [];
        for (let i = 0; i < buf.length; i += size) {
            const chunk = [];
            for (let j = 0; j < size; j++) {
                chunk.push(buf[
                    i + (endian === 'big' ? j : (size - j - 1))
                ]);
            }
            hex.push(chunk
                .map(c => {
                    return (c < 16 ? '0' : '') + c.toString(16);
                })
                .join('')
            );
        }

        return new BigNumber(hex.join(''), 16);
    },

    // TODO: var -> let 2019.11.24
    toBuffer(currBignumber, opts) {
        currBignumber = new BigNumber(currBignumber);

        if (typeof opts === 'string') {
            if (opts !== 'mpint') return 'Unsupported Buffer representation';
    
            let abs = currBignumber.absoluteValue();
            let buf = abs.toBuffer({ size : 1, endian : 'big' });
            let len = buf.length === 1 && buf[0] === 0 ? 0 : buf.length;
            if (buf[0] & 0x80) len ++;
    
            // Todo: Buffer安全
            let ret = Buffer.allocUnsafe(4 + len);
            if (len > 0) buf.copy(ret, 4 + (buf[0] & 0x80 ? 1 : 0));
            if (buf[0] & 0x80) ret[4] = 0;
    
            ret[0] = len & (0xff << 24);
            ret[1] = len & (0xff << 16);
            ret[2] = len & (0xff << 8);
            ret[3] = len & (0xff << 0);
    
            // two's compliment for negative integers:
            let isNeg = currBignumber.isLessThan(0);
            if (isNeg) {
                for (let i = 4; i < ret.length; i++) {
                    ret[i] = 0xff - ret[i];
                }
            }
            ret[4] = (ret[4] & 0x7f) | (isNeg ? 0x80 : 0);
            if (isNeg) ret[ret.length - 1] ++;
    
            return ret;
        }
    
        if (!opts) opts = {};
    
        const endian = { 1 : 'big', '-1' : 'little' }[opts.endian]
            || opts.endian || 'big';
    
        let hex = currBignumber.toString(16);
        if (hex.charAt(0) === '-') throw new Error(
            'converting negative numbers to Buffers not supported yet'
        );
    
        const size = opts.size === 'auto' ? Math.ceil(hex.length / 2) : (opts.size || 1);
    
        var len = Math.ceil(hex.length / (2 * size)) * size;
        var buf = Buffer.allocUnsafe(len); // todo: buffer安全
    
        // zero-pad the hex string so the chunks are all `size` long
        while (hex.length < 2 * len) hex = `0${hex}`;
    
        const hx = hex
            .split(new RegExp(`(.{${2 * size}})`))
            .filter(({length}) => { return length > 0; });
    
        hx.forEach((chunk, i) => {
            for (let j = 0; j < size; j++) {
                let ix = i * size + (endian === 'big' ? j : size - j - 1);
                buf[ix] = parseInt(chunk.slice(j*2,j*2+2), 16);
            }
        });
    
        return buf;
    }

};