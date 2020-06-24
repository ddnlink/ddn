import node from '../../lib/test'
import slots from '../../lib/time/slots'
import Debug from 'debug'

const debug = Debug('debug')
const expect = node.expect

describe('slots.js', () => {
  it('should be ok', () => {
    debug('slots.js')
    expect(slots).to.be.ok
  })

  it('should be object', () => {
    expect(slots).that.is.an('object')
  })

  it('should have properties', () => {
    const properties = ['interval', 'delegates', 'getTime', 'getRealTime', 'getSlotNumber', 'getSlotTime', 'getNextSlot', 'getLastSlot']
    properties.forEach(property => {
      expect(slots).to.have.property(property)
    })
  })

  describe('.interval', () => {
    const interval = slots.interval

    it('should be ok', () => {
      expect(interval).to.be.ok
    })

    it('should be number and not NaN', () => {
      expect(interval).to.be.a('number').and.not.NaN
    })
  })

  describe('.delegates', () => {
    const delegates = slots.delegates

    it('should be ok', () => {
      expect(delegates).to.be.ok
    })

    it('should be number and not NaN', () => {
      expect(delegates).to.be.a('number').to.be.not.NaN
    })
  })

  describe('#getTime', () => {
    const getTime = slots.getTime

    it('should be ok', () => {
      expect(getTime).to.be.ok
    })

    it('should be a function', () => {
      expect(getTime).to.be.a('function')
    })

    // TODO: 2020.5.10 验证之
    it('should return epoch time as number, equal to 13187043579', () => {
      const d = 14698224000000
      const time = getTime(d)
      expect(time).to.be.ok
      expect(time).to.be.a('number').to.equal(13187043579)
    })
  })

  describe('#getRealTime', () => {
    const getRealTime = slots.getRealTime

    it('should be ok', () => {
      expect(getRealTime).to.be.ok
    })

    it('should be a function', () => {
      expect(getRealTime).to.be.a('function')
    })

    it('should return return real time, convert 196144 to 1511376564000', () => {
      const d = 196144
      const real = getRealTime(d)
      expect(real).to.be.ok
      expect(real).to.be.a('number').to.equal(1511376564000)
    })
  })

  describe('#getSlotNumber', () => {
    const getSlotNumber = slots.getSlotNumber

    it('should be ok', () => {
      expect(getSlotNumber).to.be.ok
    })

    it('should be a function', () => {
      expect(getSlotNumber).to.be.a('function')
    })

    it('should return slot number, equal to 19614', () => {
      const d = 196144
      const slot = getSlotNumber(d)
      expect(slot).to.be.ok
      expect(slot).to.be.a('number').to.equal(19614)
    })
  })

  describe('#getSlotTime', () => {
    const getSlotTime = slots.getSlotTime

    it('should be ok', () => {
      expect(getSlotTime).to.be.ok
    })

    it('should be function', () => {
      expect(getSlotTime).to.be.a('function')
    })

    it('should return slot time number, equal to ', () => {
      const slotTime = getSlotTime(19614)
      expect(slotTime).to.be.ok
      expect(slotTime).to.be.a('number').to.equal(196140)
    })
  })

  describe('#getNextSlot', () => {
    const getNextSlot = slots.getNextSlot

    it('should be ok', () => {
      expect(getNextSlot).to.be.ok
    })

    it('should be function', () => {
      expect(getNextSlot).to.be.a('function')
    })

    it('should return next slot number', () => {
      const nextSlot = getNextSlot()
      expect(nextSlot).to.be.ok
      expect(nextSlot).to.be.a('number').to.be.not.NaN
    })
  })

  describe('#getLastSlot', () => {
    const getLastSlot = slots.getLastSlot

    it('should be ok', () => {
      expect(getLastSlot).to.be.ok
    })

    it('should be function', () => {
      expect(getLastSlot).to.be.a('function')
    })

    it('should return last slot number', () => {
      const lastSlot = getLastSlot(slots.getNextSlot())
      expect(lastSlot).to.be.ok
      expect(lastSlot).to.be.a('number').to.be.not.NaN
    })
  })
})
