/**
 *  Thanks to : James Halliday, http://github.com/substack/node-buffers.git"
 *
 */
import { isBinary, isText } from './util'

export class Buffers {
  constructor (bufs) {
    if (!(this instanceof Buffers)) return new Buffers(bufs)
    this.buffers = bufs || []
    this.length = this.buffers.reduce(function (size, buf) {
      return size + buf.length
    }, 0)
  }

  push () {
    for (let i = 0; i < arguments.length; i++) {
      if (!Buffer.isBuffer(arguments[i])) {
        throw new TypeError('Tried to push a non-buffer')
      }
    }

    for (let i = 0; i < arguments.length; i++) {
      const buf = arguments[i]
      this.buffers.push(buf)
      this.length += buf.length
    }
    return this.length
  }

  unshift () {
    for (let i = 0; i < arguments.length; i++) {
      if (!Buffer.isBuffer(arguments[i])) {
        throw new TypeError('Tried to unshift a non-buffer')
      }
    }

    for (let i = 0; i < arguments.length; i++) {
      const buf = arguments[i]
      this.buffers.unshift(buf)
      this.length += buf.length
    }
    return this.length
  }

  copy (dst, dStart, start, end) {
    return this.slice(start, end).copy(dst, dStart, 0, end - start)
  }

  splice (i, howMany) {
    const buffers = this.buffers
    const index = i >= 0 ? i : this.length - i
    let reps = [].slice.call(arguments, 2)

    if (howMany === undefined) {
      howMany = this.length - index
    } else if (howMany > this.length - index) {
      howMany = this.length - index
    }

    for (let i = 0; i < reps.length; i++) {
      this.length += reps[i].length
    }

    const removed = new Buffers()

    // const bytes = 0
    let startBytes = 0
    let ii = 0
    for (
      ;
      ii < buffers.length && startBytes + buffers[ii].length < index;
      ii++
    ) { startBytes += buffers[ii].length }

    if (index - startBytes > 0) {
      const start = index - startBytes

      if (start + howMany < buffers[ii].length) {
        removed.push(buffers[ii].slice(start, start + howMany))

        const orig = buffers[ii]
        // const buf = new Buffer(orig.length - howMany);
        const buf0 = Buffer.alloc(start)
        for (let i = 0; i < start; i++) {
          buf0[i] = orig[i]
        }

        const buf1 = Buffer.alloc(orig.length - start - howMany)
        for (let i = start + howMany; i < orig.length; i++) {
          buf1[i - howMany - start] = orig[i]
        }

        if (reps.length > 0) {
          const reps_ = reps.slice()
          reps_.unshift(buf0)
          reps_.push(buf1)
          buffers.splice.apply(buffers, [ii, 1].concat(reps_))
          ii += reps_.length
          reps = []
        } else {
          buffers.splice(ii, 1, buf0, buf1)
          // buffers[ii] = buf;
          ii += 2
        }
      } else {
        removed.push(buffers[ii].slice(start))
        buffers[ii] = buffers[ii].slice(0, start)
        ii++
      }
    }

    if (reps.length > 0) {
      buffers.splice.apply(buffers, [ii, 0].concat(reps))
      ii += reps.length
    }

    while (removed.length < howMany) {
      const buf = buffers[ii]
      const len = buf.length
      const take = Math.min(len, howMany - removed.length)

      if (take === len) {
        removed.push(buf)
        buffers.splice(ii, 1)
      } else {
        removed.push(buf.slice(0, take))
        buffers[ii] = buffers[ii].slice(take)
      }
    }

    this.length -= removed.length

    return removed
  }

  slice (i, j) {
    const buffers = this.buffers
    if (j === undefined) j = this.length
    if (i === undefined) i = 0

    if (j > this.length) j = this.length

    let startBytes = 0
    let si = 0
    for (
      ;
      si < buffers.length && startBytes + buffers[si].length <= i;
      si++
    ) { startBytes += buffers[si].length }

    const target = Buffer.alloc(j - i)

    let ti = 0
    for (let ii = si; ti < j - i && ii < buffers.length; ii++) {
      const len = buffers[ii].length

      const start = ti === 0 ? i - startBytes : 0
      const end = ti + len >= j - i
        ? Math.min(start + (j - i) - ti, len)
        : len

      buffers[ii].copy(target, ti, start, end)
      ti += end - start
    }

    return target
  }

  pos (i) {
    if (i < 0 || i >= this.length) throw new Error('oob')
    let l = i; let bi = 0; let bu = null
    for (;;) {
      bu = this.buffers[bi]
      if (l < bu.length) {
        return { buf: bi, offset: l }
      } else {
        l -= bu.length
      }
      bi++
    }
  }

  get (i) {
    const pos = this.pos(i)

    return this.buffers[pos.buf][pos.offset]
  }

  set (i, b) {
    const pos = this.pos(i)
    this.buffers[pos.buf][pos.offset] = b
    return b
  }

  indexOf (needle, offset) {
    if (isText(needle)) {
      needle = Buffer.from(needle)
    } else if (!isBinary(needle)) { // already a buffer // needle instanceof Buffer
      throw new Error('Invalid type for a search string')
    }

    if (!needle.length) {
      return 0
    }

    if (!this.length) {
      return -1
    }

    let i = 0; let j = 0; let match = 0; let mstart; let pos = 0

    // start search from a particular point in the virtual buffer
    if (offset) {
      const p = this.pos(offset)
      i = p.buf
      j = p.offset
      pos = offset
    }

    // for each character in virtual buffer
    for (;;) {
      while (j >= this.buffers[i].length) {
        j = 0
        i++

        if (i >= this.buffers.length) {
          // search string not found
          return -1
        }
      }

      const char = this.buffers[i][j]

      if (char === needle[match]) {
        // keep track where match started
        if (match === 0) {
          mstart = {
            i: i,
            j: j,
            pos: pos
          }
        }
        match++
        if (match === needle.length) {
          // full match
          return mstart.pos
        }
      } else if (match !== 0) {
        // a partial match ended, go back to match starting position
        // this will continue the search at the next character
        i = mstart.i
        j = mstart.j
        pos = mstart.pos
        match = 0
      }

      j++
      pos++
    }
  }

  toBuffer () {
    return this.slice()
  }

  toString (encoding, start, end) {
    return this.slice(start, end).toString(encoding)
  }

  discard (i) {
    if (i === 0) {
      return
    }

    if (i >= this.length) {
      this.buffers = []
      this.length = 0
      return
    }

    const pos = this.pos(i)
    this.buffers = this.buffers.slice(pos.buf)
    this.buffers[0] = Buffer.from(this.buffers[0].slice(pos.offset))
    this.length -= i
  }
}
