/**
 * DDN区块链自增ID生成器
 * 集成到DAO数据库管理模块
 */

import { bignum } from '@ddn/utils'

class AutoId {
  constructor(dao) {
    this.dao = dao;
    this.logger = dao.logger || console;
    this.sequences = {
      CONTRACT: 'contract_sequence',
      CONTRACT_TRANSFER: 'contract_transfer_sequence',
      DAO: 'dao_sequence',
      NFT: 'nft_sequence',
      // 其他资产类型...
    };
    this.prefixes = {
      CONTRACT: 'C',
      CONTRACT_TRANSFER: 'T',
      DAO: 'D',
      NFT: 'N',
      // 其他资产类型前缀...
    };

    // 缓存机制
    this.cache = new Map(); // 内存缓存
    this.batchSize = 10;    // 每次分配的ID数量
  }

  /**
   * 获取指定序列的当前值
   * @param {string} sequenceName - 序列名称
   * @returns {Promise<string>} - 当前序列值
   */
  async get(sequenceName) {
    const result = await this.dao.findOne('sequence', {
      where: { key: sequenceName }
    });
    return result ? result.value : '0';
  }

  /**
   * 增加序列值并返回
   * @param {string} sequenceName - 序列名称
   * @returns {Promise<string>} - 增加后的序列值
   */
  async increment(sequenceName) {
    // 使用事务确保原子性
    return await this.dao.transaction(async (t) => {
      const sequence = await this.dao.findOne('sequence', {
        where: { key: sequenceName }
      }, { transaction: t });

      if (sequence) {
        // 序列已存在，增加值
        const newValue = bignum.plus(sequence.value, 1).toString();
        await this.dao.update('sequence',
          { value: newValue },
          { where: { key: sequenceName } },
          { transaction: t }
        );
        return newValue;
      } else {
        // 序列不存在，创建新序列
        await this.dao.insert('sequence', {
          key: sequenceName,
          value: '1'
        }, { transaction: t });
        return '1';
      }
    });
  }

  /**
   * 批量分配ID并缓存
   * @param {string} sequenceName - 序列名称
   * @returns {Promise<void>}
   */
  async allocateBatch(sequenceName) {
    return await this.dao.transaction(async (t) => {
      // 获取当前值
      const sequence = await this.dao.findOne('sequence', {
        where: { key: sequenceName }
      }, { transaction: t });

      let currentValue = sequence ? parseInt(sequence.value) : 0;
      const newValue = (currentValue + this.batchSize).toString();

      if (sequence) {
        // 更新值
        await this.dao.update('sequence',
          { value: newValue },
          { where: { key: sequenceName } },
          { transaction: t }
        );
      } else {
        // 创建新序列
        await this.dao.insert('sequence', {
          key: sequenceName,
          value: newValue
        }, { transaction: t });
      }

      // 生成ID批次并缓存
      const ids = [];
      for (let i = 1; i <= this.batchSize; i++) {
        ids.push((currentValue + i).toString());
      }
      this.cache.set(sequenceName, ids);
    });
  }

  /**
   * 记录ID生成的审计日志
   * @param {string} type - 资产类型
   * @param {string} id - 生成的ID
   */
  logAudit(type, id) {
    try {
      const blockHeight = global.DDN && global.DDN.runtime ? global.DDN.runtime.block.height : 0;
      const transactionId = global.DDN && global.DDN.runtime ? global.DDN.runtime.trs.id : null;

      this.logger.info(`ID生成: 类型=${type}, ID=${id}, 区块高度=${blockHeight}, 交易ID=${transactionId}`);
    } catch (error) {
      // 记录日志失败不应影响主流程
      console.error('Failed to log ID generation audit:', error);
    }
  }

  /**
   * 获取指定类型的下一个ID
   * @param {string} type - 资产类型
   * @returns {Promise<string>} - 生成的ID
   */
  async generateId(type) {
    const sequenceName = this.sequences[type];
    if (!sequenceName) {
      throw new Error(`未知的序列类型: ${type}`);
    }

    let id;

    // 检查缓存
    if (!this.cache.has(sequenceName) || this.cache.get(sequenceName).length === 0) {
      // 缓存为空，批量分配新ID
      await this.allocateBatch(sequenceName);
    }

    // 从缓存中获取ID
    const ids = this.cache.get(sequenceName);
    id = ids.shift();

    // 根据不同类型添加不同前缀
    const prefix = this.prefixes[type] || '';
    const fullId = `${prefix}${id}`;

    // 记录审计日志
    this.logAudit(type, fullId);

    return fullId;
  }

  /**
   * 注册新的序列类型
   * @param {string} type - 序列类型名称
   * @param {string} sequenceName - 序列在数据库中的键名
   * @param {string} prefix - ID前缀
   */
  registerType(type, sequenceName, prefix = '') {
    this.sequences[type] = sequenceName;
    this.prefixes[type] = prefix;
  }
}

export default AutoId;
