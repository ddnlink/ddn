import { Cache } from '../src/cache'

describe('Cache tool test', () => {
  beforeAll(() => {

  })

  afterAll(() => {

  })

  it('Cache property test ', async () => {
    const cache = new Cache({ duration: 5000, max: 8 })

    expect(cache.duration).toStrictEqual(5000)
    expect(cache.max).toStrictEqual(8)
    expect(cache.size).toStrictEqual(0)
  })

  it('Cache all method test ', async () => {
    const cache = new Cache({ duration: 5000, max: 8 })

    cache.set('a', 1)
    cache.set('b', 2)
    expect(cache.size).toStrictEqual(2)
    expect(cache.has('a')).toStrictEqual(true)
    expect(cache.get('a')).toStrictEqual(1)
    cache.delete('a')
    expect(cache.size).toStrictEqual(1)
    expect(cache.has('a')).toStrictEqual(false)
    expect(cache.get('a')).toStrictEqual(undefined)
    cache.reset()
    expect(cache.size).toStrictEqual(0)
    expect(cache.has('a')).toStrictEqual(false)
    expect(cache.has('b')).toStrictEqual(false)
    expect(cache.get('a')).toStrictEqual(undefined)
    expect(cache.get('b')).toStrictEqual(undefined)
  })
})
