import { expect } from 'chai'
import BlockCache from '../../src/kernal/block/block-cache'

describe('BlockCache', () => {
  let blockCache
  const mockLogger = {
    debug: () => {}
  }

  beforeEach(() => {
    blockCache = new BlockCache({ maxSize: 3, logger: mockLogger })
  })

  describe('add()', () => {
    it('should add block to cache', () => {
      const block = { id: '1', data: 'test' }
      blockCache.add(block.id, block)
      expect(blockCache.get(block.id)).to.deep.equal(block)
    })

    it('should remove oldest block when cache is full', () => {
      const blocks = [
        { id: '1', data: 'test1' },
        { id: '2', data: 'test2' },
        { id: '3', data: 'test3' },
        { id: '4', data: 'test4' }
      ]

      blocks.forEach(block => blockCache.add(block.id, block))

      expect(blockCache.has('1')).to.be.false
      expect(blockCache.has('2')).to.be.true
      expect(blockCache.has('3')).to.be.true
      expect(blockCache.has('4')).to.be.true
    })
  })

  describe('get()', () => {
    it('should return undefined for non-existent block', () => {
      expect(blockCache.get('non-existent')).to.be.undefined
    })

    it('should return correct block', () => {
      const block = { id: '1', data: 'test' }
      blockCache.add(block.id, block)
      expect(blockCache.get(block.id)).to.deep.equal(block)
    })
  })

  describe('has()', () => {
    it('should return false for non-existent block', () => {
      expect(blockCache.has('non-existent')).to.be.false
    })

    it('should return true for existing block', () => {
      const block = { id: '1', data: 'test' }
      blockCache.add(block.id, block)
      expect(blockCache.has(block.id)).to.be.true
    })
  })

  describe('remove()', () => {
    it('should remove block from cache', () => {
      const block = { id: '1', data: 'test' }
      blockCache.add(block.id, block)
      blockCache.remove(block.id)
      expect(blockCache.has(block.id)).to.be.false
    })
  })

  describe('clear()', () => {
    it('should clear all blocks from cache', () => {
      const blocks = [
        { id: '1', data: 'test1' },
        { id: '2', data: 'test2' }
      ]

      blocks.forEach(block => blockCache.add(block.id, block))
      blockCache.clear()

      blocks.forEach(block => {
        expect(blockCache.has(block.id)).to.be.false
      })
    })
  })

  describe('size', () => {
    it('should return correct cache size', () => {
      expect(blockCache.size).to.equal(0)

      const blocks = [
        { id: '1', data: 'test1' },
        { id: '2', data: 'test2' }
      ]

      blocks.forEach(block => blockCache.add(block.id, block))
      expect(blockCache.size).to.equal(2)
    })
  })
})
