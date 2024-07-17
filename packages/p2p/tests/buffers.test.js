import { Buffers } from '../src/buffers'

function create (xs, split) {
  const bufs = new Buffers()
  let offset = 0
  split.forEach(function (i) {
    bufs.push(Buffer.from(xs.slice(offset, offset + i)))
    offset += i
  })
  return bufs
}

describe('Message tool test', () => {
  beforeAll(() => {

  })

  afterAll(() => {

  })

  it('Buffers slice test ', async () => {
    const xs = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    const splits = [[4, 2, 3, 1], [2, 2, 2, 2, 2], [1, 6, 3, 1], [9, 2], [10], [5, 5]]

    splits.forEach(function (split) {
      const bufs = create(xs, split)
      expect(Buffer.from(xs)).toStrictEqual(bufs.slice())
      // '[' + xs.join(',') + ']'
      //     + ' != ' +
      // '[' + [].join.call(bufs.slice(), ',') + ']'

      for (let i = 0; i < xs.length; i++) {
        for (let j = i; j < xs.length; j++) {
          const a = bufs.slice(i, j)
          const b = Buffer.from(xs.slice(i, j))

          expect(a).toStrictEqual(b)
          // '[' + [].join.call(a, ',') + ']'
          //     + ' != ' +
          // '[' + [].join.call(b, ',') + ']'
        }
      }
    })
  })

  it('Buffers splice test ', async () => {
    const xs = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    const splits = [[4, 2, 3, 1], [2, 2, 2, 2, 2], [1, 6, 3, 1], [9, 2], [10], [5, 5]]

    splits.forEach(function (split) {
      for (let i = 0; i < xs.length; i++) {
        for (let j = i; j < xs.length; j++) {
          const bufs = create(xs, split)
          const xs_ = xs.slice()

          const a_ = bufs.splice(i, j)
          const a = [].slice.call(a_.slice())
          const b = xs_.splice(i, j)
          expect(a).toStrictEqual(b)
          // '[' + a.join(',') + ']'
          //     + ' != ' +
          // '[' + b.join(',') + ']'
          expect(bufs.slice()).toStrictEqual(Buffer.from(xs_))
          // assert.eql(bufs.slice(), new Buffer(xs_),
          //     '[' + [].join.call(bufs.slice(), ',') + ']'
          //         + ' != ' +
          //     '[' + [].join.call(xs_, ',') + ']'
          // );
        }
      }
    })
  })

  it('Buffers spliceRep test ', async () => {
    const xs = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    const splits = [[4, 2, 3, 1], [2, 2, 2, 2, 2], [1, 6, 3, 1], [9, 2], [10], [5, 5]]
    const reps = [[], [1], [5, 6], [3, 1, 3, 3, 7], [9, 8, 7, 6, 5, 4, 3, 2, 1, 2, 3, 4, 5]]

    splits.forEach(function (split) {
      reps.forEach(function (rep) {
        for (let i = 0; i < xs.length; i++) {
          for (let j = i; j < xs.length; j++) {
            const bufs = create(xs, split)
            const xs_ = xs.slice()

            const a_ = bufs.splice.apply(
              bufs, [i, j].concat(Buffer.from(rep))
            )
            const a = [].slice.call(a_.slice())
            const b = xs_.splice.apply(xs_, [i, j].concat(rep))

            expect(a).toStrictEqual(b)
            // assert.eql(a, b,
            //     '[' + a.join(',') + ']'
            //         + ' != ' +
            //     '[' + b.join(',') + ']'
            // );
            expect(bufs.slice()).toStrictEqual(Buffer.from(xs_))
            // assert.eql(bufs.slice(), new Buffer(xs_),
            //     '[' + [].join.call(bufs.slice(), ',') + ']'
            //         + ' != ' +
            //     '[' + [].join.call(xs_, ',') + ']'
            // );
          }
        }
      })
    })
  })

  it('Buffers copy test ', async () => {
    const xs = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    const splits = [[4, 2, 3, 1], [2, 2, 2, 2, 2], [1, 6, 3, 1], [9, 2], [10], [5, 5]]

    splits.forEach(function (split) {
      const bufs = create(xs, split)
      const buf = Buffer.from(xs)

      for (let i = 0; i < xs.length; i++) {
        for (let j = i; j < xs.length; j++) {
          const t0 = Buffer.alloc(j - i)
          const t1 = Buffer.alloc(j - i)

          expect(bufs.copy(t0, 0, i, j)).toStrictEqual(buf.copy(t1, 0, i, j))
          expect([].slice.call(t0)).toStrictEqual([].slice.call(t1))
          // assert.eql(
          //     bufs.copy(t0, 0, i, j),
          //     buf.copy(t1, 0, i, j)
          // );

          // assert.eql(
          //     [].slice.call(t0),
          //     [].slice.call(t1)
          // );
        }
      }
    })
  })

  it('Buffers push test ', async () => {
    const bufs = new Buffers()
    bufs.push(Buffer.from([0]))
    bufs.push(Buffer.from([1, 2, 3]))
    bufs.push(Buffer.from([4, 5]))
    bufs.push(Buffer.from([6, 7, 8, 9]))

    expect([].slice.call(bufs.slice())).toStrictEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
    try {
      bufs.push(Buffer.from([11, 12]), 'moo')
    } catch (err) {
      expect(err.message).toBe('Tried to push a non-buffer')
    }
    expect(bufs.buffers.length).toBe(4)
    // assert.eql(
    //     [].slice.call(bufs.slice()),
    //     [0,1,2,3,4,5,6,7,8,9]
    // );
    // assert.throws(function () {
    //     bufs.push(Buffer.from([11,12]), 'moo');
    // });
    // assert.eql(bufs.buffers.length, 4);
  })

  it('Buffers unshift test ', async () => {
    const bufs = new Buffers()
    bufs.unshift(Buffer.from([6, 7, 8, 9]))
    bufs.unshift(Buffer.from([4, 5]))
    bufs.unshift(Buffer.from([1, 2, 3]))
    bufs.unshift(Buffer.from([0]))

    expect([].slice.call(bufs.slice())).toStrictEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
    try {
      bufs.unshift(Buffer.from([-2, -1]), 'moo')
    } catch (err) {
      expect(err.message).toBe('Tried to unshift a non-buffer')
    }
    expect(bufs.buffers.length).toBe(4)
    // assert.eql(
    //     [].slice.call(bufs.slice()),
    //     [0,1,2,3,4,5,6,7,8,9]
    // );
    // assert.throws(function () {
    //     bufs.unshift(Buffer.from([-2,-1]), 'moo');
    // });
    // assert.eql(bufs.buffers.length, 4);
  })

  it('Buffers get test ', async () => {
    const bufs = new Buffers()
    bufs.unshift(Buffer.from([6, 7, 8, 9]))
    bufs.unshift(Buffer.from([4, 5]))
    bufs.unshift(Buffer.from([1, 2, 3]))
    bufs.unshift(Buffer.from([0]))
    expect(bufs.get(0)).toBe(0)
    expect(bufs.get(1)).toBe(1)
    expect(bufs.get(2)).toBe(2)
    expect(bufs.get(3)).toBe(3)
    expect(bufs.get(4)).toBe(4)
    expect(bufs.get(5)).toBe(5)
    expect(bufs.get(6)).toBe(6)
    expect(bufs.get(7)).toBe(7)
    expect(bufs.get(8)).toBe(8)
    expect(bufs.get(9)).toBe(9)
    // assert.eql( bufs.get(0), 0 );
    // assert.eql( bufs.get(1), 1 );
    // assert.eql( bufs.get(2), 2 );
    // assert.eql( bufs.get(3), 3 );
    // assert.eql( bufs.get(4), 4 );
    // assert.eql( bufs.get(5), 5 );
    // assert.eql( bufs.get(6), 6 );
    // assert.eql( bufs.get(7), 7 );
    // assert.eql( bufs.get(8), 8 );
    // assert.eql( bufs.get(9), 9 );
  })

  it('Buffers set test ', async () => {
    var bufs = new Buffers()
    bufs.push(Buffer.from('Hel'))
    bufs.push(Buffer.from('lo'))
    bufs.push(Buffer.from('!'))
    bufs.set(0, 'h'.charCodeAt(0))
    bufs.set(3, 'L'.charCodeAt(0))
    bufs.set(5, '.'.charCodeAt(0))
    expect(bufs.slice(0).toString()).toBe('helLo.')
    // assert.eql( bufs.slice(0).toString(), 'helLo.' );
  })

  it('Buffers indexOf test ', async () => {
    var bufs = new Buffers()
    bufs.push(Buffer.from('Hel'))
    bufs.push(Buffer.from('lo,'))
    bufs.push(Buffer.from(' how are '))
    bufs.push(Buffer.from('you'))
    bufs.push(Buffer.from('?'))
    expect(bufs.indexOf('Hello')).toBe(0)
    expect(bufs.indexOf('Hello', 1)).toBe(-1)
    expect(bufs.indexOf('ello')).toBe(1)
    expect(bufs.indexOf('ello', 1)).toBe(1)
    expect(bufs.indexOf('ello', 2)).toBe(-1)
    expect(bufs.indexOf('e')).toBe(1)
    expect(bufs.indexOf('e', 2)).toBe(13)
    expect(bufs.indexOf(Buffer.from([0x65]), 2)).toBe(13)
    // assert.eql( bufs.indexOf("Hello"), 0 );
    // assert.eql( bufs.indexOf("Hello", 1), -1 );
    // assert.eql( bufs.indexOf("ello"), 1 );
    // assert.eql( bufs.indexOf("ello", 1), 1 );
    // assert.eql( bufs.indexOf("ello", 2), -1 );
    // assert.eql( bufs.indexOf("e"), 1 );
    // assert.eql( bufs.indexOf("e", 2), 13 );
    // assert.eql( bufs.indexOf(Buffer.from([0x65]), 2), 13 );
  })
})
