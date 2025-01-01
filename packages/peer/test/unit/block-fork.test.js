import { expect } from 'chai'
import sinon from 'sinon'
import Block from '../../src/kernal/block/block'
import { runtimeState } from '@ddn/utils'

describe('Block Fork Handling', () => {
  let block
  let context
  let mockLogger
  let mockRuntime
  let mockDao

  beforeEach(() => {
    mockLogger = {
      debug: sinon.spy(),
      info: sinon.spy(),
      warn: sinon.spy(),
      error: sinon.spy()
    }

    mockDao = {
      transaction: async (callback) => await callback(),
      findOne: sinon.stub(),
      findAll: sinon.stub()
    }

    mockRuntime = {
      state: runtimeState.Ready,
      loaded: true,
      delegate: {
        fork: sinon.stub().resolves()
      },
      peer: {
        p2p: {
          list: sinon.stub().resolves([
            { ip: '127.0.0.1', port: 8001 },
            { ip: '127.0.0.1', port: 8002 }
          ])
        }
      },
      loader: {
        loadBlocksFromPeer: sinon.stub().resolves()
      },
      round: {
        getRound: sinon.stub().resolves(1)
      },
      slot: {
        getSlotNumber: sinon.stub().returns(1)
      }
    }

    context = {
      logger: mockLogger,
      dao: mockDao,
      runtime: mockRuntime
    }

    block = new Block(context)
    block.sequence = {
      add: async (callback) => await callback((err) => {
        if (err) throw err
      })
    }
  })

  afterEach(() => {
    sinon.restore()
  })

  describe('receiveNewBlock()', () => {
    let mockBlock
    let mockLastBlock

    beforeEach(() => {
      mockBlock = {
        id: 'block-id-2',
        height: '2',
        previous_block: 'block-id-1',
        timestamp: Date.now()
      }

      mockLastBlock = {
        id: 'block-id-1',
        height: '1',
        previous_block: 'genesis',
        timestamp: Date.now() - 1000
      }

      block.setLastBlock(mockLastBlock)
    })

    it('should ignore block when not ready', async () => {
      mockRuntime.state = runtimeState.Syncing
      await block.receiveNewBlock(mockBlock, [])
      expect(mockLogger.debug.calledWith(sinon.match(/Not ready to receive blocks/))).to.be.true
    })

    it('should ignore block when syncing', async () => {
      block._isSyncing = true
      await block.receiveNewBlock(mockBlock, [])
      expect(mockLogger.debug.calledWith('Currently syncing blocks, ignore new block')).to.be.true
    })

    it('should ignore block when already in cache', async () => {
      block._blockCache.add(mockBlock.id, mockBlock)
      await block.receiveNewBlock(mockBlock, [])
      expect(mockLogger.debug.calledWith(`Block ${mockBlock.id} already in cache`)).to.be.true
    })

    it('should handle fork type 1', async () => {
      const forkBlock = {
        ...mockBlock,
        previous_block: 'different-previous-block'
      }
      
      const spy = sinon.spy(block, 'handleFork')
      
      try {
        await block.receiveNewBlock(forkBlock, [])
      } catch (err) {
        expect(err).to.equal('Fork-1')
      }
      
      expect(spy.calledWith(forkBlock, 1)).to.be.true
    })

    it('should handle fork type 2', async () => {
      const forkBlock = {
        ...mockLastBlock,
        id: 'different-block-id'
      }
      
      const spy = sinon.spy(block, 'handleFork')
      
      try {
        await block.receiveNewBlock(forkBlock, [])
      } catch (err) {
        expect(err).to.equal('Fork-2')
      }
      
      expect(spy.calledWith(forkBlock, 2)).to.be.true
    })

    it('should start sync for discontinuous block', async () => {
      const highBlock = {
        ...mockBlock,
        height: '4'
      }
      
      const spy = sinon.spy(block, 'startSync')
      await block.receiveNewBlock(highBlock, [])
      expect(spy.calledWith(mockLastBlock.height)).to.be.true
    })
  })

  describe('handleFork()', () => {
    let mockBlock
    let commonBlock

    beforeEach(() => {
      mockBlock = {
        id: 'fork-block-id',
        height: '2',
        previous_block: 'different-block-id',
        timestamp: Date.now()
      }

      commonBlock = {
        id: 'common-block-id',
        height: '1',
        timestamp: Date.now() - 1000
      }

      block.getCommonBlock = sinon.stub().resolves(commonBlock)
      block.rollbackToBlock = sinon.stub().resolves()
      block.startSync = sinon.stub().resolves()
    })

    it('should handle fork process correctly', async () => {
      await block.handleFork(mockBlock, 1)

      expect(mockRuntime.delegate.fork.calledWith(mockBlock, 1)).to.be.true
      expect(block.getCommonBlock.calledWith(mockBlock)).to.be.true
      expect(block.rollbackToBlock.calledWith(commonBlock.height)).to.be.true
      expect(block.startSync.calledWith(commonBlock.height)).to.be.true
    })

    it('should log fork details', async () => {
      await block.handleFork(mockBlock, 1)
      
      expect(mockLogger.warn.calledWith(sinon.match({
        fork: sinon.match({
          type: 1,
          id: mockBlock.id
        })
      }))).to.be.true
    })

    it('should handle errors during fork process', async () => {
      const error = new Error('Fork handling failed')
      block.getCommonBlock.rejects(error)

      try {
        await block.handleFork(mockBlock, 1)
        expect.fail('Should have thrown an error')
      } catch (err) {
        expect(err.message).to.include('Fork handling failed')
        expect(mockLogger.error.calledWith('Fork handling failed:', error)).to.be.true
      }
    })
  })

  describe('rollbackToBlock()', () => {
    it('should rollback to specified height', async () => {
      const currentBlock = {
        height: '3',
        id: 'current-block'
      }
      
      const targetBlock = {
        height: '2',
        id: 'target-block'
      }

      block.setLastBlock(currentBlock)
      mockDao.findOne.resolves(targetBlock)

      await block.rollbackToBlock(targetBlock.height)

      expect(mockLogger.warn.calledWith(
        `Rolling back to block at height ${targetBlock.height} from ${currentBlock.height}`
      )).to.be.true
      expect(mockLogger.info.calledWith(
        `Successfully rolled back to block at height ${targetBlock.height}`
      )).to.be.true
    })

    it('should handle errors during rollback', async () => {
      const error = new Error('Rollback failed')
      mockDao.findOne.rejects(error)

      try {
        await block.rollbackToBlock(2)
        expect.fail('Should have thrown an error')
      } catch (err) {
        expect(err.message).to.include('Failed to rollback')
        expect(mockLogger.error.calledWith('Failed to rollback:', error)).to.be.true
      }
    })
  })
})
