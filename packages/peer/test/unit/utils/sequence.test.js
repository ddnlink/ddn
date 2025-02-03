import Sequence from '../../../src/utils/sequence'

describe('Sequence', () => {
  let sequence

  beforeEach(() => {
    sequence = new Sequence({
      name: 'test-sequence'
    })
  })

  describe('基础功能', () => {
    test('应该正确初始化序列', () => {
      expect(sequence.sequence).toEqual([])
      expect(sequence.counter).toBe(1)
      expect(sequence.name).toBe('test-sequence')
    })

    test('count() 应该返回正确的队列长度', () => {
      sequence.add(() => {})
      sequence.add(() => {})
      expect(sequence.count()).toBe(2)
    })
  })

  describe('任务执行', () => {
    test('应该按顺序执行任务', (done) => {
      const results = []
      
      sequence.add(async () => {
        await Promise.resolve()
        results.push(1)
      })
      
      sequence.add(async () => {
        await Promise.resolve()
        results.push(2)
      })
      
      sequence.add(async () => {
        await Promise.resolve()
        results.push(3)
        expect(results).toEqual([1, 2, 3])
        done()
      })

      setTimeout(() => {
        if (results.length < 3) {
          done(new Error('任务执行超时'))
        }
      }, 1000)
    })

    test('应该正确处理回调方式的任务', (done) => {
      sequence.add((cb) => {
        setTimeout(() => {
          cb(null, 'success')
        }, 10)
      }, (err, result) => {
        expect(err).toBeNull()
        expect(result).toBe('success')
        done()
      })
    })

    test('应该正确处理任务错误', (done) => {
      sequence.add(() => {
        throw new Error('test error')
      }, (err) => {
        expect(err.message).toBe('test error')
        done()
      })
    })
  })

  describe('Promise 支持', () => {
    test('应该正确处理返回 Promise 的任务', (done) => {
      sequence.add(() => {
        return Promise.resolve('promise result')
      }, (err, result) => {
        expect(err).toBeNull()
        expect(result).toBe('promise result')
        done()
      })
    })

    test('应该正确处理 Promise rejection', (done) => {
      sequence.add(() => {
        return Promise.reject(new Error('promise error'))
      }, (err) => {
        expect(err.message).toBe('promise error')
        done()
      })
    })
  })

  describe('addAsync', () => {
    test('应该支持 async/await 方式调用', async () => {
      const result = await sequence.addAsync(async () => {
        return 'async result'
      })
      expect(result).toBe('async result')
    })

    test('应该正确处理 async 函数的错误', async () => {
      await expect(sequence.addAsync(async () => {
        throw new Error('async error')
      })).rejects.toThrow('async error')
    })

    test('应该支持传递参数', async () => {
      const result = await sequence.addAsync(
        async (a, b) => a + b,
        [1, 2]
      )
      expect(result).toBe(3)
    })
  })

  describe('警告机制', () => {
    test('当队列超过警告限制时应该触发警告', (done) => {
      const warningHandler = jest.fn()
      const warningLimit = 3

      const warningSequence = new Sequence({
        name: 'warning-test',
        warningLimit,
        onWarning: warningHandler
      })

      // 添加超过限制的任务
      for (let i = 0; i < warningLimit + 1; i++) {
        warningSequence.add(() => {})
      }

      // 给予足够时间让警告触发
      setTimeout(() => {
        expect(warningHandler).toHaveBeenCalledWith(
          expect.any(Number),
          warningLimit
        )
        done()
      }, 50)
    })
  })

  describe('边界情况', () => {
    test('添加非函数类型的 worker 应该被忽略', () => {
      sequence.add(null)
      sequence.add(undefined)
      sequence.add('not a function')
      expect(sequence.count()).toBe(0)
    })

    test('应该正确处理同步返回值的任务', (done) => {
      sequence.add(() => 'sync result', (err, result) => {
        expect(err).toBeNull()
        expect(result).toBe('sync result')
        done()
      })
    })

    test('应该确保回调只被调用一次', (done) => {
      const mockCallback = jest.fn()
      
      sequence.add((cb) => {
        cb(null, 'first call')
        cb(null, 'second call')
      }, mockCallback)

      setTimeout(() => {
        expect(mockCallback).toHaveBeenCalledTimes(1)
        expect(mockCallback).toHaveBeenCalledWith(null, 'first call')
        done()
      }, 50)
    })
  })
}) 