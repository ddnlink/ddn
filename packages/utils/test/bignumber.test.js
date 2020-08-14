/* ---------------------------------------------------------------------------------------------
 *  Created by DDN Team on Wed Mar 14 2017 22:29:23
 *
 *  Copyright (c) 2019 DDN Foundation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */
import BigNumber from 'bignumber.js'
import myBignumber from '../lib/bignumber.js'

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

      const result1 = block.height / 2
      const result2 = myBignumber.new(block.height) - 1
      const result3 = block.height.toString().toString() % 2
      const result4 = myBignumber.new(block.height) + 1 // + 为字符串连字符，一定注意
      console.log('result3: ', result1, result2, result3, result4)
      done()
    })

    // it('bigNumber', function (done) {
    //   const bigNumber = require('bignumber.js')
    //   const label = 'plus times: ' + COUNT + ' bigNumber.js no new'
    //   console.time(label)
    //   for (let i = 0; i < COUNT; ++i) {
    //     bigNumber('123456789123456789123456789').plus(i)
    //   }
    //   console.timeEnd(label)
    //   done()
    // })
  })
})
