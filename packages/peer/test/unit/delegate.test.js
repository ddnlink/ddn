import Delegate from '../../src/kernal/consensus/delegate'
import { jest } from '@jest/globals'

// 设置更长的超时时间
jest.setTimeout(120000)

describe('Delegate', () => {
  let delegate
  let mockRuntime
  let mockDao
  let mockLogger
  
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
        getBlocksFromPeer: jest.fn(),
        broadcast: jest.fn(),
        getPeerStatus: jest.fn()
      },
      account: {
        getAccountByPublicKey: jest.fn()
      }
    }

    // Mock DAO
    mockDao = {
      insert: jest.fn(),
      remove: jest.fn(),
      findOne: jest.fn()
    }

    // Mock logger
    mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn()
    }

    delegate = new Delegate({
      runtime: mockRuntime,
      dao: mockDao,
      logger: mockLogger
    })

    // Mock 必要的方法
    delegate.getCurrentHeight = jest.fn().mockResolvedValue(100)
    delegate.getCurrentRound = jest.fn().mockResolvedValue(1)
    delegate.getRecentBlocks = jest.fn().mockResolvedValue([])
    delegate.verifyBlockSignature = jest.fn().mockReturnValue(true)
    delegate.validateAndApplyBlocks = jest.fn().mockResolvedValue()
    delegate.broadcastCurrentState = jest.fn().mockResolvedValue()
  })

  describe('handleFork', () => {
    it('应该正确处理分叉', async () => {
      const block = { height: 100 }
      const cause = 'TEST_FORK'
      
      delegate.createStateSnapshot = jest.fn().mockResolvedValue({})
      delegate.rollbackToBlock = jest.fn()
      delegate.synchronizeFromPeers = jest.fn()
      delegate.isChainValid = jest.fn().mockResolvedValue(true)
      
      await delegate.handleFork(block, cause)
      
      expect(delegate._recoveryMode).toBe(false)
      expect(delegate.createStateSnapshot).toHaveBeenCalled()
      expect(delegate.rollbackToBlock).toHaveBeenCalledWith(99)
      expect(delegate.synchronizeFromPeers).toHaveBeenCalled()
    })

    it('当链无效时应该恢复快照', async () => {
      const block = { height: 100 }
      const mockSnapshot = { height: 99, blocks: [], delegates: [] }
      
      delegate.createStateSnapshot = jest.fn().mockResolvedValue(mockSnapshot);
      delegate.rollbackToBlock = jest.fn().mockResolvedValue();
      delegate.synchronizeFromPeers = jest.fn().mockResolvedValue();
      delegate.isChainValid = jest.fn().mockResolvedValue(false);
      delegate.restoreSnapshot = jest.fn().mockResolvedValue();
      
      mockLogger.warn = jest.fn();
      mockLogger.info = jest.fn();
      mockLogger.error = jest.fn();
      
      await delegate.handleFork(block, 'TEST_FORK');
      
      expect(delegate.createStateSnapshot).toHaveBeenCalled();
      expect(delegate.rollbackToBlock).toHaveBeenCalledWith(99);
      expect(delegate.synchronizeFromPeers).toHaveBeenCalled();
      expect(delegate.isChainValid).toHaveBeenCalled();
      expect(delegate.restoreSnapshot).toHaveBeenCalledWith(mockSnapshot);
      
      expect(delegate._recoveryMode).toBe(false);
      expect(delegate._forkedRound).toBeNull();
      
      expect(mockLogger.warn).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalled();
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('应该处理错误情况', async () => {
      const block = { height: 100 };
      const error = new Error('同步失败');
      
      delegate.synchronizeFromPeers = jest.fn().mockRejectedValue(error);
      
      await expect(delegate.handleFork(block, 'TEST_FORK')).rejects.toThrow('同步失败');
      
      expect(delegate._recoveryMode).toBe(false);
      expect(delegate._forkedRound).toBeNull();
      expect(mockLogger.error).toHaveBeenCalled();
    });
  })

  describe('synchronizeFromPeers', () => {
    it('应该从对等节点同步区块', async () => {
      const mockPeers = [{ ip: '127.0.0.1' }]
      const mockBlocks = [{ height: 101 }]
      
      mockRuntime.peer.getRandomPeers.mockResolvedValue(mockPeers)
      mockRuntime.peer.getBlocksFromPeer.mockResolvedValue(mockBlocks)
      
      await delegate.synchronizeFromPeers()
      
      expect(mockRuntime.peer.getRandomPeers).toHaveBeenCalled()
      expect(mockRuntime.peer.getBlocksFromPeer).toHaveBeenCalled()
      expect(delegate.validateAndApplyBlocks).toHaveBeenCalledWith(mockBlocks)
    })

    it('当没有可用节点时应该抛出错误', async () => {
      mockRuntime.peer.getRandomPeers.mockResolvedValue([])
      
      await expect(delegate.synchronizeFromPeers()).rejects.toThrow('没有可用的节点进行同步')
    })
  })

  describe('createStateSnapshot', () => {
    it('应该创建并保存快照', async () => {
      delegate.getCurrentHeight = jest.fn().mockResolvedValue(100)
      delegate.getDelegatePublickKeysSortByVote = jest.fn().mockResolvedValue(['key1', 'key2'])
      delegate.getRecentBlocks = jest.fn().mockResolvedValue([])
      
      const snapshot = await delegate.createStateSnapshot()
      
      expect(snapshot.height).toBe(100)
      expect(mockDao.insert).toHaveBeenCalledWith('snapshots', expect.any(Object))
    })
  })

  describe('rollbackToBlock', () => {
    it('应该回滚到指定高度', async () => {
      const targetBlock = { height: 90, id: 'block1' }
      mockRuntime.block.findOne.mockResolvedValue(targetBlock)
      
      await delegate.rollbackToBlock(90)
      
      expect(mockDao.remove).toHaveBeenCalledWith('blocks', {
        where: { height: { $gt: 90 } }
      })
      expect(mockRuntime.block.setLastBlock).toHaveBeenCalledWith(targetBlock)
    })

    it('当目标区块不存在时应该抛出错误', async () => {
      mockRuntime.block.findOne.mockResolvedValue(null)
      
      await expect(delegate.rollbackToBlock(90)).rejects.toThrow('未找到高度为 90 的区块')
    })
  })

  describe('isChainValid', () => {
    it('应该验证链的有效性', async () => {
      const mockBlocks = [
        { id: 'block1', height: 1 },
        { id: 'block2', height: 2, previous_block: 'block1' }
      ]
      
      delegate.getRecentBlocks = jest.fn().mockResolvedValue(mockBlocks)
      delegate.verifyBlockSignature = jest.fn().mockReturnValue(true)
      
      const isValid = await delegate.isChainValid()
      
      expect(isValid).toBe(true)
    })
  })
}) 