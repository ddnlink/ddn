/* ---------------------------------------------------------------------------------------------
 *  Created by DDN Team on Wed Mar 14 2017 22:29:23
 *
 *  Copyright (c) 2019 DDN Foundation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */
import { node } from './ddn-js'
 import BigNumber from 'bignumber.js'
import myBignumber from '../lib/bignumber.js'

const expect = node.expect

describe('bignumber benchmarks', function () {
  // const COUNT = 50000

  describe('bignumber.js use no new better than use new', () => {
    it('toNumber', function (done) {
      const block = {
        height: 15372423414152544454241414242342423554
      }

      const result1 = BigNumber(block.height).toNumber()
      const result2 = myBignumber.plus(0, block.height).toNumber()
      const result3 = block.height / 101
      const result4 = block.height % 101
      console.log('result1: ', result1, result2, result3, result4)
      done()
    })

    it('toString', function (done) {
      const block = {
        height: '15372423414152544454241414242342423554'
      }

      const result1 = BigNumber(block.height).toString()
      const result2 = myBignumber.new(block.height).toString()
      const result3 = block.height.toString().toString()
      console.log('result2: ', result1, result2, result3)
      done()
    })

    it('string + number, and string / number', function (done) {
      const block = {
        height: '22222222222'
      }

      const result0 = myBignumber.plus(block.height, 2).plus(1).toString() // ok
      const result00 = myBignumber.plus(block.height, 2) + 1 // error
      const result1 = block.height / 2
      const result2 = myBignumber.new(block.height) - 1
      const result3 = block.height.toString().toString() % 2
      const result4 = myBignumber.new(block.height) + 1 // + 为字符串连字符，一定注意 这种错误的用法
      console.log('result3: ', result0, result1, result2, result3, result4)
      expect(result0).to.be.equal('22222222225')
      expect(result00).to.be.equal('222222222241')
      expect(result1).to.be.equal(11111111111)
      expect(result2).to.be.equal(22222222221)
      expect(result3).to.be.equal(0)
      expect(result4).to.be.equal('222222222221')
      done()
    })

    it('bigNumber', function (done) {
      const block = {
        height: '1111'
      }
      const result = myBignumber.new(block.height).plus('1234').eq('2345')
      expect(result).to.be.true
      done()
    })
  })
})
