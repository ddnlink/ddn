import { jest } from '@jest/globals'
import Block from '../../../../src/kernal/block/block'
import Debug from 'debug'

// 创建调试器实例
const debug = Debug('debug')

// 设置测试环境
process.env.NODE_ENV = 'test'
// 增加超时时间但不要太长
jest.setTimeout(10000)

describe('Block', () => {
  let block
  let mockContext
  let mockBlock
  let mockVotes
  
  beforeEach(() => {
    // 首先初始化 mockBlock
    mockBlock = {
      id: 'test-block-id',
      height: '100',
      transactions: [
        {
          id: 'test-tx-1',
          senderPublicKey: 'sender-pk-1',
          amount: '100000000'
        },
        {
          id: 'test-tx-2', 
          senderPublicKey: 'sender-pk-2',
          amount: '200000000'
        }
      ]
    }
    debug('Test Setup - mockBlock:', mockBlock)

    // Mock context
    mockContext = {
      dao: {
        transaction: jest.fn(async (callback) => {
          const dbTrans = { /* mock transaction object */ }
          return await callback(dbTrans)
        }),
        count: jest.fn(),
        insert: jest.fn().mockResolvedValue(true),
        findOneByPrimaryKey: jest.fn().mockResolvedValue(null)
      },
      runtime: {
        account: {
          setAccount: jest.fn().mockResolvedValue({
            address: 'test-address-1',
            publicKey: 'sender-pk-1'
          }),
          getAccountByAddress: jest.fn().mockResolvedValue({
            address: 'test-address-1',
            publicKey: 'sender-pk-1',
            balance: '1000000000'
          })
        },
        transaction: {
          applyUnconfirmed: jest.fn(),
          apply: jest.fn(),
          removeUnconfirmedTransaction: jest.fn(),
          execAssetFunc: jest.fn(),
          getUnconfirmedTransactionList: jest.fn().mockResolvedValue([]),
          undoUnconfirmedList: jest.fn(),
          serializeTransaction2Db: jest.fn().mockResolvedValue(true),
          receiveTransactions: jest.fn(),
          serializeBlock2Db: jest.fn().mockResolvedValue({
            id: mockBlock.id,
            height: mockBlock.height,
            transactions: mockBlock.transactions
          })
        },
        dvm: {
          getLastHeight: jest.fn().mockResolvedValue(0),
          rollback: jest.fn(),
          commit: jest.fn()
        },
        consensus: {
          clearState: jest.fn()
        },
        peer: {
          broadcast: {
            broadcastNewBlock: jest.fn()
          }
        },
        round: {
          tick: jest.fn()
        },
        p2p: {
          post: jest.fn().mockResolvedValue({ body: { success: true } })
        }
      },
      logger: {
        debug: jest.fn(),
        error: jest.fn(),
        info: jest.fn()
      },
      oneoff: {
        clear: jest.fn()
      },
      balanceCache: {
        commit: jest.fn(),
        rollback: jest.fn()
      },
      balancesSequence: {
        add: jest.fn((cb, next) => {
          Promise.resolve()
            .then(() => cb())
            .then(() => next())
            .catch(err => next(err))
        }),
        addAsync: jest.fn(async (worker) => {
          try {
            return await worker()
          } catch (err) {
            throw err
          }
        })
      },
      config: {
        publicIp: '127.0.0.1',
        p2pPort: 8001
      },
      constants: {
        net: {
          rewardDistance: 3000000,
          rewardOffset: 1,
          fees: {
            transfer: '0.1'
          }
        },
        maxPayloadLength: 8 * 1024 * 1024,
        fixedPoint: Math.pow(10, 8),
        totalAmount: '10000000000000000'
      },
      ddnSchema: {
        validate: jest.fn().mockResolvedValue(null),
        validateBlock: jest.fn().mockResolvedValue(null)
      },
      genesisblock: {
        id: 'genesis-block-id',
        height: '1',
        transactions: []
      }
    }

    // 初始化 mockVotes
    mockVotes = {
      signatures: ['sig1', 'sig2', 'sig3']
    }

    block = new Block(mockContext)
    block.setLastBlock({
      id: 'last-block-id',
      height: '99'
    })

    mockContext.runtime.transaction = {
      ...mockContext.runtime.transaction,
      serializeBlock2Db: jest.fn().mockResolvedValue(true)
    }
  })

  describe('applyBlock', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      
      // 确保所有异步操作都能快速完成
      mockContext.runtime.transaction.apply.mockResolvedValue()
      mockContext.runtime.transaction.applyUnconfirmed.mockResolvedValue()
      mockContext.runtime.dvm.commit.mockResolvedValue()
      mockContext.runtime.round.tick.mockResolvedValue()
      
      // 确保 serializeBlock2Db 返回正确的数据
      mockContext.runtime.transaction.serializeBlock2Db.mockResolvedValue({
        ...mockBlock
      })

      // 确保 balancesSequence.addAsync 正确执行回调
      mockContext.balancesSequence.addAsync.mockImplementation(async (worker) => {
        debug('Executing balancesSequence.addAsync with worker')
        const result = await worker()
        debug('Worker execution completed with result:', result)
        return result
      })

      debug('Mock setup complete')
    })

    it('should successfully apply block with transactions', async () => {
      await block.applyBlock({
        block: mockBlock,
        votes: mockVotes,
        isBroadcast: true,
        isSaveBlock: true
      })

      expect(mockContext.dao.transaction).toHaveBeenCalled()
      expect(mockContext.runtime.transaction.applyUnconfirmed).toHaveBeenCalled()
      expect(mockContext.runtime.transaction.apply).toHaveBeenCalled()
      expect(mockContext.runtime.dvm.commit).toHaveBeenCalledWith(mockBlock.height)
      expect(mockContext.balanceCache.commit).toHaveBeenCalled()
      expect(mockContext.oneoff.clear).toHaveBeenCalled()
      expect(mockContext.runtime.consensus.clearState).toHaveBeenCalled()
    })

    it('should handle transaction errors and rollback', async () => {
      mockContext.runtime.transaction.apply.mockRejectedValueOnce(new Error('Transaction error'))
      
      await expect(block.applyBlock({
        block: mockBlock,
        votes: mockVotes,
        isBroadcast: true,
        isSaveBlock: true
      })).rejects.toThrow('Transaction error')

      expect(mockContext.balanceCache.rollback).toHaveBeenCalled()
    })

    it('should broadcast block if isBroadcast is true', async () => {
      debug('Testing broadcast block')
      
      // 确保 broadcastNewBlock 被正确 mock
      mockContext.runtime.peer.broadcast.broadcastNewBlock = jest.fn().mockImplementation((block, votes) => {
        debug('Broadcasting block:', block)
        debug('With votes:', votes)
        return Promise.resolve()
      })

      const params = {
        block: mockBlock,
        votes: mockVotes,
        isBroadcast: true,
        isSaveBlock: true
      }
      debug('Calling applyBlock with params:', params)

      await block.applyBlock(params)

      // 添加延迟等待 setImmediate 执行完成
      await new Promise(resolve => setTimeout(resolve, 100))

      debug('Block applied successfully')
      debug('broadcastNewBlock mock:', mockContext.runtime.peer.broadcast.broadcastNewBlock.mock)
      debug('broadcastNewBlock calls:', mockContext.runtime.peer.broadcast.broadcastNewBlock.mock.calls)

      expect(mockContext.runtime.peer.broadcast.broadcastNewBlock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockBlock.id,
          height: mockBlock.height,
          transactions: expect.any(Array)
        }),
        expect.objectContaining({
          signatures: expect.any(Array)
        })
      )
    })

    it('should not broadcast block if isBroadcast is false', async () => {
      await block.applyBlock({
        block: mockBlock,
        votes: mockVotes,
        isBroadcast: false,
        isSaveBlock: true
      })

      expect(mockContext.runtime.peer.broadcast.broadcastNewBlock).not.toHaveBeenCalled()
    })

    it('should save block if isSaveBlock is true', async () => {
      debug('Testing save block')
      const mockSaveBlock = jest.spyOn(block, 'saveBlock')
      
      await block.applyBlock({
        block: mockBlock,
        votes: mockVotes,
        isBroadcast: true,
        isSaveBlock: true
      })

      debug('Block applied successfully')
      debug('saveBlock calls:', mockSaveBlock.mock.calls)

      expect(mockSaveBlock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockBlock.id,
          height: mockBlock.height,
          transactions: mockBlock.transactions
        }),
        expect.objectContaining({})
      )
    })

    it('should not save block if isSaveBlock is false', async () => {
      const mockSaveBlock = jest.spyOn(block, 'saveBlock').mockImplementation(() => Promise.resolve())
      
      await block.applyBlock({
        block: mockBlock,
        votes: mockVotes,
        isBroadcast: true,
        isSaveBlock: false
      })

      expect(mockSaveBlock).not.toHaveBeenCalled()
    })
  })

  describe('saveBlock', () => {
    it('should handle errors when saving block', async () => {
      debug('Testing error handling in saveBlock')
      const error = new Error('DB Error')
      mockContext.runtime.transaction.serializeBlock2Db.mockRejectedValue(error)
      
      try {
        await block.saveBlock(mockBlock, {})
      } catch (err) {
        debug('saveBlock error:', err.message)
      }

      await expect(block.saveBlock(mockBlock, {}))
        .rejects
        .toThrow('insert block fail: DB Error')
    })
  })
}) 