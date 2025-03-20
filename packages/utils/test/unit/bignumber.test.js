import { fail } from 'assert';
import { bignum } from '../../src';
import BigNumber from 'bignumber.js';

describe('bignum', () => {
    test('new should create a BigNumber instance', () => {
        const num = bignum.new(10);
        expect(bignum.isBigNumber(num)).toBe(true);
    });

    test('isBigNumber should correctly identify BigNumber instances', () => {
        const num = new BigNumber(10);
        expect(bignum.isBigNumber(num)).toBe(true);
        expect(bignum.isBigNumber(10)).toBe(false);
    });

    test('plus should perform addition', () => {
        const result = bignum.plus(10, 20);
        expect(result.toString()).toBe('30');
    });

    test('minus should perform subtraction', () => {
        const result = bignum.minus(20, 10);
        expect(result.toString()).toBe('10');
    });

    test('multiply should perform multiplication', () => {
        const result = bignum.multiply(2, 5);
        expect(result.toString()).toBe('10');
    });

    test('divide should perform division', () => {
        const result = bignum.divide(10, 2);
        expect(result.toString()).toBe('5');
    });

    test('isNaN should correctly identify NaN values', () => {
        const nan = new BigNumber(NaN);
        expect(bignum.isNaN(nan)).toBe(true);
        expect(bignum.isNaN(10)).toBe(false);
    });

    test('isZero should correctly identify zero values', () => {
        const zero = new BigNumber(0);
        expect(bignum.isZero(zero)).toBe(true);
        expect(bignum.isZero(10)).toBe(false);
    });

    test('isEqualTo should correctly compare values', () => {
        const num1 = new BigNumber(10);
        const num2 = new BigNumber(10);
        const num3 = new BigNumber(20);
        expect(bignum.isEqualTo(num1, num2)).toBe(true);
        expect(bignum.isEqualTo(num1, num3)).toBe(false);
    });

    test('isGreaterThan should correctly compare values', () => {
        const num1 = new BigNumber(20);
        const num2 = new BigNumber(10);
        expect(bignum.isGreaterThan(num1, num2)).toBe(true);
        expect(bignum.isGreaterThan(num2, num1)).toBe(false);
    });

    test('isGreaterThanOrEqualTo should correctly compare values', () => {
        const num1 = new BigNumber(20);
        const num2 = new BigNumber(10);
        const num3 = new BigNumber(20);
        expect(bignum.isGreaterThanOrEqualTo(num1, num2)).toBe(true);
        expect(bignum.isGreaterThanOrEqualTo(num1, num3)).toBe(true);
        expect(bignum.isGreaterThanOrEqualTo(num2, num1)).toBe(false);
    });

    test('isLessThan should correctly compare values', () => {
        const num1 = new BigNumber(10);
        const num2 = new BigNumber(20);
        expect(bignum.isLessThan(num1, num2)).toBe(true);
        expect(bignum.isLessThan(num2, num1)).toBe(false);
    });

    test('isLessThanOrEqualTo should correctly compare values', () => {
        const num1 = new BigNumber(10);
        const num2 = new BigNumber(20);
        const num3 = new BigNumber(10);
        expect(bignum.isLessThanOrEqualTo(num1, num2)).toBe(true);
        expect(bignum.isLessThanOrEqualTo(num1, num3)).toBe(true);
        expect(bignum.isLessThanOrEqualTo(num2, num1)).toBe(false);
    });

    test('abs should return the absolute value', () => {
        const num = new BigNumber(-10);
        const result = bignum.abs(num);
        expect(result.toString()).toBe('10');
    });

    test('modulo should perform modulo operation', () => {
        const result = bignum.modulo(10, 3);
        expect(result.toString()).toBe('1');
    });

    test('floor should return the closest smaller integer', () => {
        const num = new BigNumber(10.5);
        const result = bignum.floor(num);
        expect(result.toString()).toBe('10');
    });

    test('ceil should return the closest larger integer', () => {
        const num = new BigNumber(10.5);
        const result = bignum.ceil(num);
        expect(result.toString()).toBe('11');
    });

    test('pow should perform power operation', () => {
        const result = bignum.pow(2, 3);
        expect(result.toString()).toBe('8');
    });

    test('fromBuffer should convert buffer to BigNumber', () => {
        const buf = Buffer.from([0x01, 0x00]);
        const result = bignum.fromBuffer(buf);
        expect(result.toString()).toBe('256');
    });

    test('toBuffer should convert BigNumber to buffer', () => {
        const num = new BigNumber(256);
        const result = bignum.toBuffer(num);
        expect(result.toString('hex')).toBe('0100');
    });

    describe('this._roundFees isBigNumber and isNaN relationship', () => {
        // 1. 它是一个 bignumber，就一定不是 NaN
        test('should be a BigNumber and not NaN', () => {
            const this_roundFees = bignum.new(100);
            expect(bignum.isBigNumber(this_roundFees)).toBe(true);
            expect(bignum.isNaN(this_roundFees)).toBe(false);
        });

        // 2. 一个 BigNumber型的 NaN，一定是一个 bignumber
        test('should be NaN and not a BigNumber', () => {
            const this_roundFees = new BigNumber(NaN);
            //   console.log("typeof this_roundFees: ", typeof this_roundFees, bignum.isBigNumber(this_roundFees));

            expect(bignum.isBigNumber(this_roundFees)).toBe(true);
            expect(bignum.isNaN(this_roundFees)).toBe(true);
        });

        // 3. 一个普通的 NaN，一定不是一个 bignumber，但是一个 BigNumber型的NaN
        test('should not be a BigNumber and might be NaN', () => {
            const nonBigNumberNaN = NaN;
            expect(bignum.isBigNumber(nonBigNumberNaN)).toBe(false);
            expect(bignum.isNaN(nonBigNumberNaN)).toBe(true);

            const nonBigNumberNonNaN = 'not a number';
            expect(bignum.isBigNumber(nonBigNumberNonNaN)).toBe(false);
            expect(bignum.isNaN(nonBigNumberNonNaN)).toBe(true);
        });

        // 4. 一个普通的数字，或字符串型数字，不是一个 bignumber，也不是一个 NaN
        test('other cases', () => {
            let validNumber = 100;
            expect(bignum.isBigNumber(validNumber)).toBe(false);
            expect(bignum.isNaN(validNumber)).toBe(false);
     
            validNumber = '100';
            expect(bignum.isBigNumber(validNumber)).toBe(false);
            expect(bignum.isNaN(validNumber)).toBe(false);
        });

        // 5. 一个普通的字符串型的数字，一定不是一个 bignumber，也不是一个 NaN
        // 总结：
        // 数字、字符串型数字，不是一个 NaN，也不是一个 bignumber，但可以转换成 bignumber，即可直观辨认，也可快速计算
        // 所以，我们在程序中，
        // 1. 用字符串表示数值结果（数字也可以），因为 bignumber.toString() 方法可以快速转换；
        // 2. 判断一个参数数值是否合法，需要先判断是否是一个 NaN，再判断是否是一个 bignumber
        test('other cases', () => {
            let validNumber = 'undefined';
            expect(bignum.isNaN(validNumber)).toBe(true);

            validNumber = null;
            expect(bignum.isNaN(validNumber)).toBe(true);

            validNumber = 'fail';
            expect(bignum.isNaN(validNumber)).toBe(true);

            validNumber = 'false';
            expect(bignum.isNaN(validNumber)).toBe(true);

            validNumber = '字符串';
            expect(bignum.isNaN(validNumber)).toBe(true);

            validNumber = NaN;
            expect(bignum.isNaN(validNumber)).toBe(true);

            // 这里特殊，因为 bignum.isNaN 本身先将数字转换成了 BigNumber，再判断是否是 NaN
            validNumber = '111';
            expect(bignum.isNaN(validNumber)).toBe(false);
            expect(bignum.isBigNumber(validNumber)).toBe(false);
        });
    });
});