/* ---------------------------------------------------------------------------------------------
 *  Created by DDN Team on Sat Jun 16 2017 12:14:9
 *
 *  Copyright (c) 2019 DDN Foundation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

/**
 * passed
 */
import node from '@ddn/node-sdk/lib/test'

import DdnUtil from '@ddn/utils'

import constants from '../../lib/constants'
import BlockStatus from '../../lib/kernal/block/block-status'

describe('Constants params', () => {
  it('test block reward', done => {
    global.config = { net: 'testnet', settings: { delegateNumber: 101 } }
    let blockStatus = new BlockStatus(global)
    node.expect(blockStatus.calcMilestone(1)).to.equal('0')
    node.expect(blockStatus.calcMilestone(2999999)).to.equal('0')
    node.expect(blockStatus.calcMilestone(3000000)).to.equal('0')
    // node.expect(blockStatus.calcMilestone(3000001)).to.equal(0);

    node.expect(blockStatus.calcReward(1)).to.equal('0')
    node.expect(blockStatus.calcReward(2)).to.equal(constants.testnet.milestones[0])
    node.expect(blockStatus.calcReward(60480)).to.equal(constants.testnet.milestones[0])
    node.expect(blockStatus.calcReward(60481)).to.equal(constants.testnet.milestones[0])
    node.expect(blockStatus.calcReward(60482)).to.equal(constants.testnet.milestones[0])
    node.expect(blockStatus.calcReward(60483)).to.equal(constants.testnet.milestones[0])
    node.expect(blockStatus.calcReward(2999999)).to.equal(constants.testnet.milestones[0])
    node.expect(blockStatus.calcReward(3000000)).to.equal(constants.testnet.milestones[0])
    node.expect(blockStatus.calcReward(3000001)).to.equal(constants.testnet.milestones[1])

    node.expect(blockStatus.calcSupply(1)).to.equal(constants.totalAmount)
    node.expect(blockStatus.calcSupply(2)).to.equal(constants.totalAmount)
    node.expect(blockStatus.calcSupply(101)).to.equal(DdnUtil.bignum.plus(constants.totalAmount, DdnUtil.bignum.multiply(constants.testnet.milestones[0], 100)).toString())
    node.expect(blockStatus.calcSupply(102)).to.equal(DdnUtil.bignum.plus(constants.totalAmount, DdnUtil.bignum.multiply(constants.testnet.milestones[0], 100)).toString())

    // todo 下面的还没有修改
    // node.expect(blockStatus.calcSupply(3000000)).to.equal(11499950500000000);
    // node.expect(blockStatus.calcSupply(3000003)).to.equal(11500000700000000);

    global.config = { net: 'mainnet' }
    blockStatus = new BlockStatus(global)
    node.expect(blockStatus.calcReward(0)).to.equal('0')
    node.expect(blockStatus.calcReward(1)).to.equal('0')
    node.expect(blockStatus.calcReward(2)).to.equal('500000000')
    node.expect(blockStatus.calcReward(3464499)).to.equal('400000000')
    node.expect(blockStatus.calcReward(3464500)).to.equal('400000000')
    node.expect(blockStatus.calcReward(6464499)).to.equal('300000000')
    node.expect(blockStatus.calcReward(6464500)).to.equal('300000000')
    node.expect(blockStatus.calcReward(9464499)).to.equal('200000000')
    node.expect(blockStatus.calcReward(9464500)).to.equal('200000000')
    node.expect(blockStatus.calcReward(12464499)).to.equal('100000000')
    node.expect(blockStatus.calcReward(12464500)).to.equal('100000000')
    node.expect(blockStatus.calcReward(15464499)).to.equal('100000000')
    node.expect(blockStatus.calcReward(15464500)).to.equal('100000000')

    // node.expect(blockStatus.calcSupply(0)).to.equal(10000000000000000);
    // node.expect(blockStatus.calcSupply(1)).to.equal(10000000000000000);
    // node.expect(blockStatus.calcSupply(2)).to.equal(10000000000000000);
    // node.expect(blockStatus.calcSupply(3)).to.equal(10000000000000000);
    // node.expect(blockStatus.calcSupply(111)).to.equal(10000050000000000);
    // node.expect(blockStatus.calcSupply(491077)).to.equal(10245530500000000);
    // node.expect(blockStatus.calcSupply(513236)).to.equal(10256590000000000);
    // node.expect(blockStatus.calcSupply(537943)).to.equal(10268962500000000);
    // node.expect(blockStatus.calcSupply(587374)).to.equal(10293657000000000);
    // node.expect(blockStatus.calcSupply(3464502)).to.equal(11685800300000000);
    // node.expect(blockStatus.calcSupply(6464505)).to.equal(12839351000000000);
    // node.expect(blockStatus.calcSupply(15464515)).to.equal(14546450900000000);
    // node.expect(blockStatus.calcSupply(15464615)).to.equal(14546461000000000);
    // node.expect(blockStatus.calcSupply(18464517)).to.equal(14846451200000000);

    done()
  })

  it('transaction sort should be stable', function (done) {
    const sortBy = function (a, b) {
      if (a.type !== b.type) {
        if (a.type === 1) {
          return 1
        }
        if (b.type === 1) {
          return -1
        }
        return a.type - b.type
      }
      if (a.amount !== b.amount) {
        return a.amount - b.amount
      }
      return a.id.localeCompare(b.id)
    }

    function randNumber (min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min
    }

    function randomTrs () {
      const trs = []
      for (let i = 0; i < 100; ++i) {
        trs.push({
          type: randNumber(0, 8),
          amount: randNumber(0, 10000),
          id: node.randomUsername()
        })
      }
      return trs
    }

    function clone (a) {
      const b = []
      for (const i in a) {
        b.push(a[i])
      }
      return b
    }

    const trs = randomTrs()
    const trs1 = clone(trs)
    trs1.sort(sortBy)

    const trs2 = clone(trs1)
    trs2.sort(sortBy)
    node.expect(trs1).to.eql(trs2)

    trs2.sort(sortBy)
    node.expect(trs1).to.eql(trs2)

    const fs = require('fs')
    const path = require('path')
    const trs11 = JSON.parse(fs.readFileSync(path.join(__dirname, './data/trs.11'), 'utf8'))
    const trs11_1 = clone(trs11)
    trs11_1.sort(sortBy)

    const trs11_2 = clone(trs11_1)
    trs11_2.sort(sortBy)
    node.expect(trs11_1).eql(trs11_2)

    const trs10 = JSON.parse(fs.readFileSync(path.join(__dirname, './data/trs.10'), 'utf8'))
    const trs10_1 = clone(trs10)
    trs10_1.sort(sortBy)

    const trs10_2 = clone(trs10_1)
    trs10_2.sort(sortBy)
    node.expect(trs10_1).eql(trs10_2)
    done()
  })
})
