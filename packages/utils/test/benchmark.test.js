/* ---------------------------------------------------------------------------------------------
 *  Created by DDN Team on Wed Mar 14 2017 22:29:23
 *
 *  Copyright (c) 2019 DDN Foundation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */
import BigNumber from 'bignumber.js'
import myBignumber from '../lib/bignumber.js'
import Big from 'big.js'

describe('bignumber benchmarks', function () {
  const COUNT = 50000

  describe('bignumber.js use no new better than use new', () => {
    it('bigNumber', function (done) {
      const BigNumber = require('bignumber.js')
      const label = 'plus times: ' + COUNT + ' bigNumber.js use new'
      console.time(label)
      for (let i = 0; i < COUNT; ++i) {
        const num = new BigNumber('123456789123456789123456789')
        num.plus(i)
      }
      console.timeEnd(label)
      done()
    })

    it('bigNumber', function (done) {
      const bigNumber = require('bignumber.js')
      const label = 'plus times: ' + COUNT + ' bigNumber.js no new'
      console.time(label)
      for (let i = 0; i < COUNT; ++i) {
        bigNumber('123456789123456789123456789').plus(i)
      }
      console.timeEnd(label)
      done()
    })
  })

  describe('plus, bignumber.js package better than mine', () => {
    it('bigNumber.js', function (done) {
      const BigNumber = require('bignumber.js')
      const label = '+plus times: ' + COUNT + ' bigNumber.js'
      console.time(label)
      for (let i = 0; i < COUNT; ++i) {
        BigNumber('123456789123456789123456789').plus(i)
      }
      console.timeEnd(label)
      done()
    })

    it('big.js', function (done) {
      const label = '+plus times: ' + COUNT + ' big.js '
      console.time(label)
      for (let i = 0; i < COUNT; ++i) {
        Big('123456789123456789123456789').plus(i)
      }
      console.timeEnd(label)
      done()
    })

    it('bigNumber', function (done) {
      const label = '+plus times: ' + COUNT + ' bigNumber.js'
      console.time(label)
      for (let i = 0; i < COUNT; ++i) {
        myBignumber.plus('123456789123456789123456789', i)
      }
      console.timeEnd(label)
      done()
    })
  })

  describe('minus, bignumber.js package is best', () => {
    it('bigNumber', function (done) {
      const label = '-minus times: ' + COUNT + ' bigNumber.js'
      console.time(label)
      for (let i = 0; i < COUNT; ++i) {
        BigNumber('123456789123456789123456789').minus(i)
      }
      console.timeEnd(label)
      done()
    })

    // it('big.js', function (done) {
    //   const label = 'times: ' + COUNT + ' big.js minus'
    //   console.time(label)
    //   for (let i = 0; i < COUNT; ++i) {
    //     Big('123456789123456789123456789').minus(i)
    //   }
    //   console.timeEnd(label)
    //   done()
    // })

    it('mine', function (done) {
      const label = '-minus times: ' + COUNT + ' mine'
      console.time(label)
      for (let i = 0; i < COUNT; ++i) {
        myBignumber.minus('123456789123456789123456789', i)
      }
      console.timeEnd(label)
      done()
    })
  })

  describe('multiply, bignumber.js package is best', () => {
    it('bigNumber', function (done) {
      const label = '* multiply times: ' + COUNT + ' bigNumber.js'
      console.time(label)
      for (let i = 1; i < COUNT; ++i) {
        BigNumber('12345').multipliedBy(123)
      }
      console.timeEnd(label)
      done()
    })

    it('mine', function (done) {
      const label = '* multiply times: ' + COUNT + ' mine'
      console.time(label)
      for (let i = 1; i < COUNT; ++i) {
        myBignumber.multiply('12345', 123)
      }
      console.timeEnd(label)
      done()
    })

    it('mine', function (done) {
      const label = '* multiply times: ' + COUNT + ' native'
      console.time(label)
      for (let i = 1; i < COUNT; ++i) {
        12345 * 123
      }
      console.timeEnd(label)
      done()
    })
  })

  describe('divide, bignumber.js package is best', () => {
    it('bigNumber', function (done) {
      const label = '/ divide times: ' + COUNT + ' bigNumber.js'
      console.time(label)
      for (let i = 1; i < COUNT; ++i) {
        BigNumber('123456789').dividedBy(123)
      }
      console.timeEnd(label)
      done()
    })

    it('mine', function (done) {
      const label = '/ divide times: ' + COUNT + ' mine'
      console.time(label)
      for (let i = 1; i < COUNT; ++i) {
        myBignumber.divide('123456789', 123)
      }
      console.timeEnd(label)
      done()
    })

    it('native', function (done) {
      const label = '/ divide times: ' + COUNT + ' native'
      console.time(label)
      for (let i = 1; i < COUNT; ++i) {
        123456789 / 123
      }
      console.timeEnd(label)
      done()
    })
  })

  describe('isEqualTo, bignumber.js package is best', () => {
    it('bigNumber', function (done) {
      const label = '= isEqualTo times: ' + COUNT + ' bigNumber.js'
      console.log(BigNumber('123456789').isEqualTo(123456789))
      console.time(label)
      for (let i = 1; i < COUNT; ++i) {
        BigNumber('123456789').isEqualTo(123456789)
      }
      console.timeEnd(label)
      done()
    })

    it('mine', function (done) {
      const label = '= isEqualTo times: ' + COUNT + ' mine'
      console.log(myBignumber.isEqualTo('123456789', 123456789))
      console.time(label)
      for (let i = 1; i < COUNT; ++i) {
        myBignumber.isEqualTo('123456789', 123456789)
      }
      console.timeEnd(label)
      done()
    })

    it('native', function (done) {
      const label = '===  times: ' + COUNT + ' native'
      console.time(label)
      for (let i = 1; i < COUNT; ++i) {
        123456789 === 123
      }
      console.timeEnd(label)
      done()
    })
  })
})
