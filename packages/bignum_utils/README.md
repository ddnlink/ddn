## 方法：

    /**
     * 实例化一个大数
     */
    new(num | string | BigNumber)

    /**
     * 加法操作
     */
    plus(num | string | BigNumber, ...args)

    /**
     * 减法操作
     */
    minus(num | string | BigNumber, ...args)

    /**
     * 乘法操作
     */
    multiply(num | string | BigNumber, ...args) {

    /**
     * 除法操作
     */
    divide(num | string | BigNumber, ...args)

    /**
     * 非数值判断
     */
    isNaN(num | string | BigNumber) {

    /**
     * 零判断
     */
    isZero(num | string | BigNumber)

    /**
     * 相等判断
     */
    isEqualTo(num | string | BigNumber, num | string | BigNumber)

    /**
     * 大于判断
     */
    isGreaterThan(num | string | BigNumber, num | string | BigNumber)

    /**
     * 大于等于判断
     */
    isGreaterThanOrEqualTo(num | string | BigNumber, num | string | BigNumber)

    /**
     * 小于判断
     */
    isLessThan(num | string | BigNumber, num | string | BigNumber)

    /**
     * 小于等于判断
     */
    isLessThanOrEqualTo(num | string | BigNumber, num | string | BigNumber)

    /**
     * 绝对值
     */
    abs(num | string | BigNumber)

    /**
     * 取模
     */
    modulo(num | string | BigNumber, num | string | BigNumber)

    /**
     * 最接近的较小整数
     */
    floor(num | string | BigNumber)

    /**
     * 最接近的较大整数
     */
    ceil(num | string | BigNumber)

    /**
     * 乘方 POW
     * 返回bigNumber对象
     */
    pow(num | string | BigNumber, num | string | BigNumber)

    /**
     * 将byte数组转成16进制大数值
     */
    fromBuffer(buf, opts)
