// 检查导入路径是否正确
import Round from '../../../../src/kernal/consensus/round';
import { bignum } from '@ddn/utils';
import RoundChanges from '../../../../src/kernal/consensus/round-changes';

// 模拟依赖
jest.mock('@ddn/utils', () => ({
  bignum: {
    isGreaterThan: jest.fn(),
    modulo: jest.fn(),
    plus: jest.fn(),
    floor: jest.fn(),
    divide: jest.fn(),
    isEqualTo: jest.fn(),
    minus: jest.fn(),
    new: jest.fn(),
    isNaN: jest.fn()
  }
}));

jest.mock('../../../../src/kernal/consensus/round-changes', () => jest.fn().mockImplementation(() => ({
  at: jest.fn(),
  getClubBonus: jest.fn()
})));

let round;
let context;
let block;
let dbTrans;

beforeEach(() => {
  context = {
    runtime: {
      account: {
        merge: jest.fn()
      },
      round: {
        _unFeesByRound: {},
        _unRewardsByRound: {}
      }
    },
    logger: {
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    },
    constants: {
      delegates: 10,
      foundAddress: 'foundAddress'
    },
    dao: {
      findOne: jest.fn(),
      findListByGroup: jest.fn(),
      remove: jest.fn()
    }
  };

  round = new Round(context); // 确保 round 被正确初始化
  block = {
    height: 100,
    generator_public_key: 'generatorPublicKey',
    total_fee: '100',
    reward: '100',
    id: 'blockId'
  };
  dbTrans = {};
});


describe('Round.processRoundRewards', () => {

  it('should process round rewards successfully', async () => {
    const roundNumber = 10;
    const delegates = ['delegate1', 'delegate2'];
    round._delegatesByRound[roundNumber] = delegates;

    const balance1 = {
      balance: '200',
      fees: '100',
      rewards: '100'
    };
    const balance2 = {
      balance: '300',
      fees: '150',
      rewards: '150'
    };

    const mockRoundChanges = new RoundChanges();
    mockRoundChanges.at.mockReturnValueOnce(balance1).mockReturnValueOnce(balance2);

    const bonus = {
      fees: '50',
      rewards: '50'
    };
    mockRoundChanges.getClubBonus.mockReturnValue(bonus);

    await round.processRoundRewards(block, roundNumber, dbTrans);

    expect(context.runtime.account.merge).toHaveBeenCalledTimes(3);
    expect(context.runtime.account.merge).toHaveBeenNthCalledWith(1, null, {
      publicKey: 'delegate1',
      balance: '200',
      u_balance: '200',
      fees: '100',
      rewards: '100',
      block_id: 'blockId',
      round: roundNumber
    }, dbTrans);
    expect(context.runtime.account.merge).toHaveBeenNthCalledWith(2, null, {
      publicKey: 'delegate2',
      balance: '300',
      u_balance: '300',
      fees: '150',
      rewards: '150',
      block_id: 'blockId',
      round: roundNumber
    }, dbTrans);
    expect(context.runtime.account.merge).toHaveBeenNthCalledWith(3, context.constants.foundAddress, {
      address: context.constants.foundAddress,
      balance: '100',
      u_balance: '100',
      fees: '50',
      rewards: '50',
      block_id: 'blockId',
      round: roundNumber
    }, dbTrans);
    expect(round._rewardsErrorCount).toBe(0);
  });

  it('should handle no delegates in round', async () => {
    const roundNumber = 10;
    round._delegatesByRound[roundNumber] = [];

    const result = await round.processRoundRewards(block, roundNumber, dbTrans);

    expect(context.logger.warn).toHaveBeenCalledWith('No delegates in round:', roundNumber);
    expect(result).toBe(false);
    expect(round._rewardsErrorCount).toBe(0);
  });

  it('should handle invalid balance for delegate', async () => {
    const roundNumber = 10;
    const delegates = ['delegate1'];
    round._delegatesByRound[roundNumber] = delegates;

    const balance = {
      balance: 'NaN',
      fees: '100',
      rewards: '100'
    };

    const mockRoundChanges = new RoundChanges();
    mockRoundChanges.at.mockReturnValue(balance);

    await round.processRoundRewards(block, roundNumber, dbTrans);

    expect(context.logger.error).toHaveBeenCalledWith('Invalid balance for delegate:', {
      delegate: 'delegate1',
      balance
    });
    expect(context.runtime.account.merge).toHaveBeenCalledTimes(0);
    expect(round._rewardsErrorCount).toBe(1);
  });

  it('should handle invalid fees or rewards for delegate', async () => {
    const roundNumber = 10;
    const delegates = ['delegate1'];
    round._delegatesByRound[roundNumber] = delegates;

    const balance = {
      balance: '200',
      fees: 'NaN',
      rewards: 'NaN'
    };

    const mockRoundChanges = new RoundChanges();
    mockRoundChanges.at.mockReturnValue(balance);

    await round.processRoundRewards(block, roundNumber, dbTrans);

    expect(context.logger.error).toHaveBeenCalledWith('Invalid fees or rewards for delegate:', {
      delegate: 'delegate1',
      fees: 'NaN',
      rewards: 'NaN'
    });
    expect(context.runtime.account.merge).toHaveBeenCalledTimes(0);
    expect(round._rewardsErrorCount).toBe(1);
  });

  it('should handle error and trigger synchronization after 5 errors', async () => {
    const roundNumber = 10;
    const delegates = ['delegate1'];
    round._delegatesByRound[roundNumber] = delegates;

    const balance = {
      balance: 'NaN',
      fees: 'NaN',
      rewards: 'NaN'
    };

    const mockRoundChanges = new RoundChanges();
    mockRoundChanges.at.mockReturnValue(balance);

    round._rewardsErrorCount = 4;

    const triggerSynchronizationSpy = jest.spyOn(round, 'triggerSynchronization');

    await round.processRoundRewards(block, roundNumber, dbTrans);

    expect(context.logger.error).toHaveBeenCalledWith('Process round rewards error:', expect.any(Error));
    expect(context.logger.warn).toHaveBeenCalledWith('Reached 5 errors in processRoundRewards, triggering synchronization...');
    expect(triggerSynchronizationSpy).toHaveBeenCalled();
    expect(round._rewardsErrorCount).toBe(0);
  });
});


// 假设这是一个测试用例
describe('Round.processRoundRewards', () => {
  it('should process round rewards successfully', async () => {
    const roundNumber = 10;
    const delegates = ['delegate1', 'delegate2'];
    round._delegatesByRound[roundNumber] = delegates;

    // 添加调试信息
    console.log('Context object:', context);

    const mockRoundChanges = new RoundChanges(context, roundNumber);
    mockRoundChanges.at.mockReturnValueOnce(balance1).mockReturnValueOnce(balance2);

    const bonus = {
      fees: '50',
      rewards: '50'
    };
    mockRoundChanges.getClubBonus.mockReturnValue(bonus);

    await round.processRoundRewards(block, roundNumber, dbTrans);

    expect(context.runtime.account.merge).toHaveBeenCalledTimes(3);
    expect(context.runtime.account.merge).toHaveBeenNthCalledWith(1, null, {
      publicKey: 'delegate1',
      balance: '200',
      u_balance: '200',
      fees: '100',
      rewards: '100',
      block_id: 'blockId',
      round: roundNumber
    }, dbTrans);
    expect(context.runtime.account.merge).toHaveBeenNthCalledWith(2, null, {
      publicKey: 'delegate2',
      balance: '300',
      u_balance: '300',
      fees: '150',
      rewards: '150',
      block_id: 'blockId',
      round: roundNumber
    }, dbTrans);
    expect(context.runtime.account.merge).toHaveBeenNthCalledWith(3, context.constants.foundAddress, {
      address: context.constants.foundAddress,
      balance: '100',
      u_balance: '100',
      fees: '50',
      rewards: '50',
      block_id: 'blockId',
      round: roundNumber
    }, dbTrans);
    expect(round._rewardsErrorCount).toBe(0);
  });

  it('should handle no delegates in round', async () => {
    const roundNumber = 10;
    round._delegatesByRound[roundNumber] = [];

    const result = await round.processRoundRewards(block, roundNumber, dbTrans);

    expect(context.logger.warn).toHaveBeenCalledWith('No delegates in round:', roundNumber);
    expect(result).toBe(false);
    expect(round._rewardsErrorCount).toBe(0);
  });

  it('should handle invalid balance for delegate', async () => {
    const roundNumber = 10;
    const delegates = ['delegate1'];
    round._delegatesByRound[roundNumber] = delegates;

    const balance = {
      balance: 'NaN',
      fees: '100',
      rewards: '100'
    };

    const mockRoundChanges = new RoundChanges();
    mockRoundChanges.at.mockReturnValue(balance);

    await round.processRoundRewards(block, roundNumber, dbTrans);

    expect(context.logger.error).toHaveBeenCalledWith('Invalid balance for delegate:', {
      delegate: 'delegate1',
      balance
    });
    expect(context.runtime.account.merge).toHaveBeenCalledTimes(0);
    expect(round._rewardsErrorCount).toBe(1);
  });

  it('should handle invalid fees or rewards for delegate', async () => {
    const roundNumber = 10;
    const delegates = ['delegate1'];
    round._delegatesByRound[roundNumber] = delegates;

    const balance = {
      balance: '200',
      fees: 'NaN',
      rewards: 'NaN'
    };

    const mockRoundChanges = new RoundChanges();
    mockRoundChanges.at.mockReturnValue(balance);

    await round.processRoundRewards(block, roundNumber, dbTrans);

    expect(context.logger.error).toHaveBeenCalledWith('Invalid fees or rewards for delegate:', {
      delegate: 'delegate1',
      fees: 'NaN',
      rewards: 'NaN'
    });
    expect(context.runtime.account.merge).toHaveBeenCalledTimes(0);
    expect(round._rewardsErrorCount).toBe(1);
  });

  it('should handle error and trigger synchronization after 5 errors', async () => {
    const roundNumber = 10;
    const delegates = ['delegate1'];
    round._delegatesByRound[roundNumber] = delegates;

    const balance = {
      balance: 'NaN',
      fees: 'NaN',
      rewards: 'NaN'
    };

    const mockRoundChanges = new RoundChanges();
    mockRoundChanges.at.mockReturnValue(balance);

    round._rewardsErrorCount = 4;

    const triggerSynchronizationSpy = jest.spyOn(round, 'triggerSynchronization');

    await round.processRoundRewards(block, roundNumber, dbTrans);

    expect(context.logger.error).toHaveBeenCalledWith('Process round rewards error:', expect.any(Error));
    expect(context.logger.warn).toHaveBeenCalledWith('Reached 5 errors in processRoundRewards, triggering synchronization...');
    expect(triggerSynchronizationSpy).toHaveBeenCalled();
    expect(round._rewardsErrorCount).toBe(0);
  });
});


// 假设这是一个测试用例
describe('Round.processRoundRewards', () => {
  it('should process round rewards successfully', async () => {
    // 定义一个包含所有必要属性的 ctx 对象
    let ctx = {
      runtime: {
        round: {
          _unFeesByRound: {},
          _unRewardsByRound: {}
        }
      },
      constants: {
        // 这里可以设置必要的常量
        delegates: 10
      },
      logger: {
        info: jest.fn(),
        error: jest.fn()
      }
    };

    // 创建 RoundChanges 实例
    let changes = new RoundChanges(ctx, 1);

    // 执行测试逻辑
    ctx = {
      constants: {
        net: {
          // 填入必要的网络常量
          rewardRatio: 0.1
        },
        // 其他必要的常量
        delegates: 10
      },
      runtime: {
        round: {
          _unFeesByRound: {},
          _unRewardsByRound: {}
        }
      },
      logger: console // 假设使用 console 作为日志记录器
    };

    const round = 1;
    changes = new RoundChanges(ctx, round);
    // 后续的测试逻辑
  });
});