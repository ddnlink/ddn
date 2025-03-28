// 安全引入 crypto 模块
const getCrypto = () => {
    if (typeof window !== 'undefined' && window.crypto) {
        return window.crypto; // 浏览器环境
    } else {
        return require('crypto'); // Node.js 环境
    }
};

export const crypto = getCrypto();