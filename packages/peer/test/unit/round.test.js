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
    // Mock logger
    mockLogger = {
      debug: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      trace: jest.fn()
    }

    // Mock runtime
    mockRuntime = {
      block: {
        getLastBlock: jest.fn().mockResolvedValue({ height: 100 }),
        findOne: jest.fn(),
        setLastBlock: jest.fn()
      },
      peer: {
        getPeers: jest.fn(),
        broadcast: jest.fn(),
        getPeerStatus: jest.fn()
      },
      delegate: {
        getDisorderDelegatePublicKeys: jest.fn()
      },
      account: {
        merge: jest.fn().mockResolvedValue(true),
        updateAccount: jest.fn().mockResolvedValue(true),
        generateAddressByPublicKey: jest.fn().mockReturnValue('test_address'),
        getAccountByPublicKey: jest.fn()
      },
      socketio: {
        emit: jest.fn()
      }
    }

    // Mock constants
    mockConstants = {
      delegates: 101,
      net: {
        rewardRatio: 0.2
      },
      foundAddress: 'foundation_address'
    }

    // 补充 mock runtime.round
    mockRuntime.round = {
      _unFeesByRound: {},
      _unRewardsByRound: {},
      _feesByRound: {},
      _rewardsByRound: {},
      _delegatesByRound: {},
      getRound: jest.fn(),
      flush: jest.fn().mockResolvedValue(true),
      processVotes: jest.fn().mockResolvedValue(true),
      processOutsiders: jest.fn().mockResolvedValue([])
    }

    // 补充 mock dao 方法
    const mockDao = {
      findOne: jest.fn(),
      remove: jest.fn().mockResolvedValue(true),
      db_str: jest.fn(str => str),
      db_fnSum: jest.fn(field => `SUM(${field})`),
      db_fnGroupConcat: jest.fn(field => `GROUP_CONCAT(${field})`),
      findListByGroup: jest.fn().mockResolvedValue([]),
      transaction: jest.fn(async (fn) => await fn({}))
    }

    const context = {
      runtime: mockRuntime,
      logger: mockLogger,
      constants: mockConstants,
      config: {
        database: {
          options: {
            dialect: 'sqlite'
          }
        }
      },
      dao: mockDao
    }

    round = new Round(context)
  })

  describe('tick', () => {
    it('应该正确处理同一轮次内的区块', async () => {
      // Mock block data - 使用数字类型而不是字符串
      const block = {
        height: 50,                           // 改为数字
        generator_public_key: 'delegate1',
        id: 'block1',
        total_fee: 100,                      // 改为数字
        reward: 500                          // 改为数字
      }

      // Mock getRound 返回相同的轮次
      round.getRound = jest.fn()
        .mockResolvedValueOnce('1')
        .mockResolvedValueOnce('1')

      await round.tick(block, {})

      // 验证基本账户更新
      expect(mockRuntime.account.merge).toHaveBeenCalledWith(
        null,
        {
          publicKey: 'delegate1',
          producedblocks: 1,
          block_id: 'block1',
          round: '1'
        },
        {}
      )

      // 验证轮次数据更新 - 使用 toString() 进行比较
      expect(round._feesByRound['1'].toString()).toBe('100')
      expect(round._rewardsByRound['1'][0].toString()).toBe('500')
      expect(round._delegatesByRound['1']).toContain('delegate1')
    })

    it('应该正确处理轮次切换', async () => {
      const block = {
        height: '101',
        generator_public_key: 'delegate1',
        id: 'block1',
        total_fee: '100',
        reward: '500'
      }

      // Mock getRound 返回不同的轮次
      round.getRound = jest.fn()
        .mockResolvedValueOnce('1')  // current round
        .mockResolvedValueOnce('2')  // next round

      // Mock 必要的方法
      round.processRoundRewards = jest.fn().mockResolvedValue(true)
      round.processOutsiders = jest.fn().mockResolvedValue([])
      round.processVotes = jest.fn().mockResolvedValue(true)
      round.flush = jest.fn().mockResolvedValue(true)

      await round.tick(block, {})

      // 验证轮次切换处理
      expect(round.processRoundRewards).toHaveBeenCalled()
      expect(round.processOutsiders).toHaveBeenCalled()
      expect(round.processVotes).toHaveBeenCalled()
      expect(round.flush).toHaveBeenCalled()

      // 验证数据清理
      expect(round._feesByRound['1']).toBeUndefined()
      expect(round._rewardsByRound['1']).toBeUndefined()
      expect(round._delegatesByRound['1']).toBeUndefined()
    })

    it('应该正确处理轮次切换时的奖励分发', async () => {
      // 使用 bignum 进行精确计算
      const { bignum } = require('@ddn/utils')

      // 设置初始数据
      const totalFees = bignum.new('100')
      const totalRewards = bignum.new('500')
      const delegateCount = 116
      const currentRound = '3'
      const nextRound = '4'

      // 设置 round 实例的属性
      round._feesByRound = { [currentRound]: totalFees }
      round._rewardsByRound = { [currentRound]: [totalRewards] }
      round._delegatesByRound = { 
        [currentRound]: Array(delegateCount).fill().map((_, i) => `delegate${i}`)
      }

      // Mock getRound
      round.getRound = jest.fn()
        .mockResolvedValueOnce(currentRound)
        .mockResolvedValueOnce(nextRound)

      // Mock processOutsiders
      round.processOutsiders = jest.fn().mockResolvedValue([])

      // Mock processVotes
      round.processVotes = jest.fn().mockResolvedValue(true)

      // Mock flush
      round.flush = jest.fn().mockResolvedValue(true)

      // Mock RoundChanges 之前先清除之前的 mock
      jest.unmock('../../src/kernal/consensus/round-changes')
      
      // Mock RoundChanges
      const RoundChanges = jest.fn().mockImplementation((context) => ({
        _roundFees: totalFees,
        _roundRewards: [totalRewards],
        _CLUB_BONUS_RATIO: context.constants.net.rewardRatio,
        at: jest.fn().mockImplementation((index) => {
          const ratio = bignum.minus(1, context.constants.net.rewardRatio)
          const totalDistributeFees = bignum.floor(bignum.multiply(totalFees, ratio))
          const fees = bignum.floor(bignum.divide(totalDistributeFees, delegateCount))
          const rewards = bignum.floor(bignum.multiply(totalRewards, ratio))
          return {
            fees: fees.toString(),
            rewards: rewards.toString(),
            balance: bignum.plus(fees, rewards).toString()
          }
        }),
        getClubBonus: jest.fn().mockImplementation(() => {
          const ratio = context.constants.net.rewardRatio
          const fees = bignum.multiply(totalFees, ratio)
          const rewards = bignum.multiply(totalRewards, ratio)
          return {
            fees: fees.toString(),
            rewards: rewards.toString()
          }
        })
      }))

      round.RoundChanges = RoundChanges

      const block = {
        height: 303,
        generator_public_key: 'delegate1',
        id: 'block1',
        total_fee: totalFees.toString(),
        reward: totalRewards.toString()
      }

      // Mock getDisorderDelegatePublicKeys
      mockRuntime.delegate.getDisorderDelegatePublicKeys = jest.fn()
        .mockResolvedValue(round._delegatesByRound[currentRound])

      await round.tick(block, {})

      // 验证奖励分发
      expect(mockRuntime.account.merge).toHaveBeenCalled()
      const mergeCall = mockRuntime.account.merge.mock.calls[0]
      expect(mergeCall[1].fees).not.toBe('NaN')
      expect(mergeCall[1].rewards).not.toBe('NaN')
      expect(mergeCall[1].balance).not.toBe('NaN')

      // 验证轮次切换相关方法被调用
      expect(round.processOutsiders).toHaveBeenCalledWith(block, currentRound, {})
      expect(round.processVotes).toHaveBeenCalledWith(currentRound, {})
      expect(round.flush).toHaveBeenCalledWith(currentRound, {})

      // 验证数据清理
      expect(round._feesByRound[currentRound]).toBeUndefined()
      expect(round._rewardsByRound[currentRound]).toBeUndefined()
      expect(round._delegatesByRound[currentRound]).toBeUndefined()
    })

    it('应该正确处理未参与铸块的受托人', async () => {
      const block = {
        height: '101'
      }

      // Mock getDisorderDelegatePublicKeys
      mockRuntime.delegate.getDisorderDelegatePublicKeys = jest.fn()
        .mockResolvedValue(['delegate1', 'delegate2', 'delegate3'])

      round._delegatesByRound['1'] = ['delegate1', 'delegate2']
      round.runtime.account.generateAddressByPublicKey = jest.fn()
        .mockReturnValue('delegate3_address')

      await round.processOutsiders(block, '1', {})

      // 验证未参与铸块的受托人处理
      expect(mockRuntime.account.updateAccount).toHaveBeenCalledWith(
        { missedblocks: round.dao.db_str('missedblocks + 1') },
        { address: "'delegate3_address'" },
        {}
      )
    })
  })
}) 