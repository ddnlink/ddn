import { setup } from '../../src/config/index.js';
// import Debug from 'debug';
jest.mock('debug');
// jest.mock('@ddn/asset-base', () => ({
//   __esModule: true, // 如果模块使用 ES6 导出
//   default: {
//     Utils: {
//       loadFromJson: jest.fn() // 确保 mock 函数正确设置
//     }
//   }
// }));

// import Asset from '@ddn/asset-base';
// console.log('Asset', Asset);

describe('setup 方法测试套件', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.DDN_CONFIG = undefined;
  });

  test('合并默认配置和自定义配置', () => {
    const customConfig = { network: 'testnet' };
    const { config } = setup(customConfig);

    expect(config).toEqual(expect.objectContaining({
      ...customConfig
    }));
  });

  test('环境变量注入应覆盖现有配置', () => {
    process.env.DDN_CONFIG = JSON.stringify({ apiEndpoint: 'https://api.test' });
    const { config } = setup({ apiEndpoint: 'http://localhost' });

    expect(config.apiEndpoint).toBe('https://api.test');
  });

  test('无效环境变量应抛出异常', () => {
    process.env.DDN_CONFIG = 'invalid_json';

    expect(() => setup()).toThrow(SyntaxError);
    expect(() => setup()).toThrowError(/Unexpected token/);
  });

});

// Fixme: 测试 Asset.Utils.loadFromJson ，mock 实现应该有点问题，另外，前端加载插件如何优化处理？
// describe('测试 Asset.Utils.loadFromJson', () => {
//   it('应该正确调用并返回 mock 数据', () => {
//     // 1. 准备 mock 数据
//     const mockAssets = { id: 'test-asset' };
//     const mockResult = { success: true };
    
//     // 2. 设置 mock 实现
//     Asset.Utils.loadFromJson.mockReturnValue(mockResult);
    
//     // 3. 执行被测代码 (假设这是你的实际调用)
//     // 4. 验证
//     Asset.Utils.loadFromJson(mockAssets);

//     // Fixme: 实际代码 Asset.Utils.loadFromJson 没有返回值，应该不需要验证返回值。
//     expect(Asset.Utils.loadFromJson).toHaveBeenCalledWith(mockAssets);
//   });

//   it('应该处理错误情况', () => {
//     Asset.Utils.loadFromJson.mockImplementation(() => {
//       throw new Error('加载失败');
//     });
    
//     expect(() => Asset.Utils.loadFromJson({})).toThrow('加载失败');
//   });
// });
