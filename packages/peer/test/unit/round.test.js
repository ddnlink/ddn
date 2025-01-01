import Round from '../../src/kernal/consensus/round'
import { jest } from '@jest/globals'

// 设置更长的超时时间
jest.setTimeout(120000) // 设置为120秒

describe('Round', () => {
  let round
  let mockRuntime
  let mockLogger
  let mockConstants
  
  beforeEach(() => {
    // Mock runtime
    mockRuntime = {
      block: {
        getLastBlock: jest.fn().mockResolvedValue({ height: 100 }),
        findOne: jest.fn(),
        setLastBlock: jest.fn()
      },
      peer: {
        getRandomPeers: jest.fn(),
        broadcast: jest.fn(),
        getPeerStatus: jest.fn()
      },
      delegate: {
        getDisorderDelegatePublicKeys: jest.fn()
      },
      account: {
        getAccountByPublicKey: jest.fn()
      }
    }

    // Mock logger
    mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn()
    }

    // Mock constants
    mockConstants = {
      delegates: 101
    }

    round = new Round({
      runtime: mockRuntime,
      logger: mockLogger,
      constants: mockConstants
    })
  })

  describe('waitForStability', () => {
    it('当网络稳定时应该返回true', async () => {
      round.isNetworkStable = jest.fn()
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true)
      
      const result = await round.waitForStability()
      
      expect(result).toBe(true)
      expect(round.isNetworkStable).toHaveBeenCalledTimes(2)
    })

    it('当网络不稳定时应该抛出错误', async () => {
      round.isNetworkStable = jest.fn().mockResolvedValue(false)
      
      await expect(round.waitForStability()).rejects.toThrow('网络状态不稳定')
    })
  })

  describe('validateDelegateList', () => {
    it('应该验证有效的受托人列表', async () => {
      const mockDelegates = Array(101).fill().map((_, i) => `key${i}`)
      mockRuntime.delegate.getDisorderDelegatePublicKeys.mockResolvedValue(mockDelegates)
      mockRuntime.account.getAccountByPublicKey.mockResolvedValue({ is_delegate: 1 })
      
      const result = await round.validateDelegateList(1)
      
      expect(result).toBe(true)
    })

    it('当受托人数量不正确时应该返回false', async () => {
      const mockDelegates = ['key1', 'key2'] // 只有2个受托人
      mockRuntime.delegate.getDisorderDelegatePublicKeys.mockResolvedValue(mockDelegates)
      
      const result = await round.validateDelegateList(1)
      
      expect(result).toBe(false)
    })
  })

  describe('broadcastRoundSwitch', () => {
    it('应该广播轮次切换信息', async () => {
      await round.broadcastRoundSwitch(1, 2)
      
      expect(mockRuntime.peer.broadcast).toHaveBeenCalledWith(
        'round/switch',
        expect.objectContaining({
          prevRound: 1,
          newRound: 2
        })
      )
    })
  })

  describe('waitForNetworkConfirmation', () => {
    let originalDateNow;
    
    beforeEach(() => {
      // 保存原始的 Date.now
      originalDateNow = Date.now;
    });
    
    afterEach(() => {
      // 测试后恢复原始的 Date.now
      Date.now = originalDateNow;
    });

    it('当足够节点确认时应该返回true', async () => {
      const mockPeers = Array(101).fill().map(() => ({ round: 2 }));
      
      round.getPeerStatus = jest.fn().mockResolvedValue(mockPeers);
      round.currentRound = 2;
      
      // Mock sleep 函数避免实际等待
      round.sleep = jest.fn().mockResolvedValue();
      
      const result = await round.waitForNetworkConfirmation();
      expect(result).toBe(true);
    });

    it('超时时应该抛出错误', async () => {
      const mockPeers = [
        { round: 1 },
        { round: 2 }
      ];
      
      round.getPeerStatus = jest.fn().mockResolvedValue(mockPeers);
      round.currentRound = 2;
      
      // Mock sleep 函数避免实际等待
      round.sleep = jest.fn().mockResolvedValue();
      
      // Mock Date.now
      let currentTime = Date.now();
      Date.now = jest.fn()
        .mockReturnValueOnce(currentTime) // 第一次调用返回起始时间
        .mockReturnValueOnce(currentTime + 61000); // 第二次调用返回超时时间
      
      await expect(round.waitForNetworkConfirmation()).rejects.toThrow('等待网络确认超时');
    });
  })

  describe('getMinimumPeers', () => {
    it('应该返回正确的最小节点数', () => {
      const result = round.getMinimumPeers()
      
      expect(result).toBe(Math.ceil(101 * 2 / 3))
    })
  })
}) 