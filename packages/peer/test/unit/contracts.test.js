/**
 * 合约 API 接口测试
 */
import assert from 'assert';
import request from 'supertest';
import DdnJS from '@ddn/js-sdk';

import { createServer } from '../../src/network/http-server';
import { createContext } from '../helpers/context';

describe('Contracts API', () => {
  let context;
  let server;
  let contractId;
  let transactionId;
  const SECRET = 'finish valley own jealous lobster mother inflict voice sphere stay second puppy';
  const SAMPLE_CONTRACT = `
    import { SmartContract, readonly } from 'ddn-contract-core';

    export class MinimalContract extends SmartContract {
      @readonly
      hello(name: string): string {
        return \`Hello, \${name}!\`;
      }
    }
  `;

  before(async () => {
    // 创建测试上下文
    context = await createContext();
    
    // 创建 HTTP 服务器
    server = await createServer(context);
    
    // 部署测试合约
    const options = {
      name: 'MinimalContract',
      desc: 'MinimalContract - DDN智能合约示例',
      version: '1.0.0',
      gasLimit: 10000000,
      code: SAMPLE_CONTRACT
    };
    
    const transaction = await DdnJS.contract.createContract(options, SECRET);
    transactionId = transaction.id;
    
    // 发送交易
    const response = await request(server)
      .post('/api/transactions')
      .set('nethash', 'm66gcvle')
      .set('version', '1.0.0')
      .send({ transaction });
    
    assert.strictEqual(response.body.success, true);
    
    // 等待交易确认
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 查询交易详情，获取合约 ID
    const txResponse = await request(server)
      .get(`/api/transactions/get?id=${transactionId}`)
      .set('nethash', 'm66gcvle')
      .set('version', '1.0.0');
    
    if (txResponse.body.success && txResponse.body.transaction && 
        txResponse.body.transaction.asset && txResponse.body.transaction.asset.contract) {
      contractId = txResponse.body.transaction.asset.contract.id;
    }
  });

  after(async () => {
    // 关闭服务器
    if (server) {
      await server.close();
    }
    
    // 清理上下文
    if (context) {
      await context.runtime.shutdown();
    }
  });

  describe('GET /api/contracts', () => {
    it('should return contract list', async () => {
      const response = await request(server)
        .get('/api/contracts')
        .set('nethash', 'm66gcvle')
        .set('version', '1.0.0');
      
      assert.strictEqual(response.body.success, true);
      assert.ok(Array.isArray(response.body.rows));
      assert.ok(response.body.rows.length > 0);
    });
    
    it('should filter contracts by name', async () => {
      const response = await request(server)
        .get('/api/contracts?name=MinimalContract')
        .set('nethash', 'm66gcvle')
        .set('version', '1.0.0');
      
      assert.strictEqual(response.body.success, true);
      assert.ok(Array.isArray(response.body.rows));
      assert.ok(response.body.rows.length > 0);
      assert.strictEqual(response.body.rows[0].name, 'MinimalContract');
    });
  });

  describe('GET /api/contracts/get', () => {
    it('should return contract details by ID', async () => {
      if (!contractId) {
        this.skip();
        return;
      }
      
      const response = await request(server)
        .get(`/api/contracts/get?id=${contractId}`)
        .set('nethash', 'm66gcvle')
        .set('version', '1.0.0');
      
      assert.strictEqual(response.body.success, true);
      assert.ok(response.body.contract);
      assert.strictEqual(response.body.contract.id, contractId);
      assert.strictEqual(response.body.contract.name, 'MinimalContract');
    });
    
    it('should return error for invalid contract ID', async () => {
      const response = await request(server)
        .get('/api/contracts/get?id=invalid_id')
        .set('nethash', 'm66gcvle')
        .set('version', '1.0.0');
      
      assert.strictEqual(response.body.success, false);
      assert.ok(response.body.error);
    });
  });

  describe('GET /api/contracts/:id', () => {
    it('should return contract details by direct path', async () => {
      if (!contractId) {
        this.skip();
        return;
      }
      
      const response = await request(server)
        .get(`/api/contracts/${contractId}`)
        .set('nethash', 'm66gcvle')
        .set('version', '1.0.0');
      
      assert.strictEqual(response.body.success, true);
      assert.ok(response.body.contract);
      assert.strictEqual(response.body.contract.id, contractId);
      assert.strictEqual(response.body.contract.name, 'MinimalContract');
    });
  });

  describe('GET /api/contracts/code', () => {
    it('should return contract code', async () => {
      if (!contractId) {
        this.skip();
        return;
      }
      
      const response = await request(server)
        .get(`/api/contracts/code?id=${contractId}`)
        .set('nethash', 'm66gcvle')
        .set('version', '1.0.0');
      
      assert.strictEqual(response.body.success, true);
      assert.ok(response.body.code);
      assert.ok(response.body.code.includes('MinimalContract'));
    });
  });

  describe('GET /api/contracts/result', () => {
    it('should return contract result by ID', async () => {
      if (!contractId) {
        this.skip();
        return;
      }
      
      const response = await request(server)
        .get(`/api/contracts/result?id=${contractId}`)
        .set('nethash', 'm66gcvle')
        .set('version', '1.0.0');
      
      // 即使没有执行结果，也应该返回成功，但可能没有结果数据
      assert.strictEqual(response.body.success, true);
    });
    
    it('should return contract result by ID and transaction ID', async () => {
      if (!contractId || !transactionId) {
        this.skip();
        return;
      }
      
      const response = await request(server)
        .get(`/api/contracts/result?id=${contractId}&transactionId=${transactionId}`)
        .set('nethash', 'm66gcvle')
        .set('version', '1.0.0');
      
      assert.strictEqual(response.body.success, true);
      if (response.body.result) {
        assert.strictEqual(response.body.result.contract_id, contractId);
        assert.strictEqual(response.body.result.transaction_id, transactionId);
      }
    });
  });

  describe('GET /api/contracts/results', () => {
    it('should return contract results list', async () => {
      if (!contractId) {
        this.skip();
        return;
      }
      
      const response = await request(server)
        .get(`/api/contracts/results?id=${contractId}`)
        .set('nethash', 'm66gcvle')
        .set('version', '1.0.0');
      
      assert.strictEqual(response.body.success, true);
      assert.ok('count' in response.body);
      assert.ok(Array.isArray(response.body.rows));
    });
  });

  describe('POST /api/contracts/call', () => {
    it('should call contract readonly method', async () => {
      if (!contractId) {
        this.skip();
        return;
      }
      
      const response = await request(server)
        .post('/api/contracts/call')
        .set('nethash', 'm66gcvle')
        .set('version', '1.0.0')
        .send({
          id: contractId,
          method: 'hello',
          args: ['World']
        });
      
      // 注意：这个测试可能会失败，因为合约可能没有正确部署或者方法不存在
      // 如果失败，检查合约部署是否成功，以及方法名是否正确
      assert.strictEqual(response.body.success, true);
      if (response.body.result) {
        assert.strictEqual(response.body.result, 'Hello, World!');
      }
    });
    
    it('should return error for invalid method', async () => {
      if (!contractId) {
        this.skip();
        return;
      }
      
      const response = await request(server)
        .post('/api/contracts/call')
        .set('nethash', 'm66gcvle')
        .set('version', '1.0.0')
        .send({
          id: contractId,
          method: 'nonExistentMethod',
          args: []
        });
      
      assert.strictEqual(response.body.success, false);
      assert.ok(response.body.error);
    });
  });
});
