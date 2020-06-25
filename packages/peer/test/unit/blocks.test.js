/**
 * passed
 */
import path from 'path'
import Debug from 'debug'
import DdnUtils from '@ddn/utils'
import node from '@ddn/node-sdk/lib/test'

import {
  requireFile
} from '@ddn/core/lib/getUserConfig'

const debug = Debug('debug')

const genesisblockFile = path.resolve(process.cwd(), './examples/fun-tests/config/genesisBlock.json')
const genesisblock = requireFile(genesisblockFile)

const block = {
  blockHeight: '0',
  id: '0',
  generatorPublicKey: '',
  totalAmount: '0',
  totalFee: '0'
}

let testBlocksUnder100 = false

describe('GET /blocks/getHeight', () => {
  it('Should be ok', done => {
    node.api.get('/blocks/getHeight')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, {
        body
      }) => {
        debug('getHeight', JSON.stringify(body))
        node.expect(err).be.not.ok
        node.expect(body).to.have.property('success').to.be.true
        if (body.success === true && body.height !== null) {
          node.expect(body).to.have.property('height')
          const result = DdnUtils.bignum.isGreaterThan(body.height, '0')
          node.expect(result).be.true

          if (body.success === true) {
            block.blockHeight = body.height
            if (DdnUtils.bignum.isGreaterThan(body.height, 100)) {
              testBlocksUnder100 = true
            }
          } else {
            debug('Request failed or height is null')
          }
        }
        done()
      })
  })
})

describe('GET /blocks/getFee', () => {
  it('Should be ok', done => {
    node.api.get('/blocks/getfee')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, {
        body
      }) => {
        debug('GET /blocks/getFee ', JSON.stringify(body))
        node.expect(body).to.have.property('success').to.be.true
        if (body.success === true && body.fee !== null) {
          node.expect(body).to.have.property('fee')
          // node.expect(body.fee).to.equal(node.Fees.transactionFee);
          const result = DdnUtils.bignum.isEqualTo(body.fee, node.Fees.transactionFee)
          node.expect(result).to.be.true
        } else {
          debug('Request failed or fee is null')
        }
        done()
      })
  })
})

// 该接口不存在
// describe("GET /blocks/getNethash", function () {

//     it.skip("Get blockchain nethash. Should be ok", function (done) {
//         node.api.get("/blocks/getNethash")
//             .set("Accept", "application/json")
//             .expect("Content-Type", /json/)
//             .expect(200)
//             .end(function (err, {body}) {
//                 // debug(JSON.stringify(body));
//                 node.expect(body).to.have.property("success").to.be.true;
//                 if (body.success === true && body.nethash !== null) {
//                     node.expect(body).to.have.property("nethash");
//                     node.expect(body.nethash).to.equal(node.config.nethash);
//                 } else {
//                     console.log("Request failed or nethash is null");
//                 }
//                 done();
//             });
//     });
// });

describe('GET /blocks', () => {
  it('Using height. Should be ok', done => {
    const height = block.blockHeight
    const limit = 100
    const offset = 0
    node.api.get(`/blocks?height=${height}&limit=${limit}&offset=${offset}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, {
        body
      }) => {
        // debug(JSON.stringify(body));
        node.expect(body).to.have.property('success').to.be.true
        if (body.success === true && body.blocks !== null) {
          node.expect(body).to.have.property('blocks').that.is.an('array')
          node.expect(body).to.have.property('count').to.equal(1)
          node.expect(body.blocks.length).to.equal(1)
          node.expect(body.blocks[0]).to.have.property('previous_block')
          node.expect(body.blocks[0]).to.have.property('total_amount')
          node.expect(body.blocks[0]).to.have.property('total_fee')
          node.expect(body.blocks[0]).to.have.property('generator_id')
          node.expect(body.blocks[0]).to.have.property('confirmations')
          node.expect(body.blocks[0]).to.have.property('block_signature')
          node.expect(body.blocks[0]).to.have.property('number_of_transactions')
          node.expect(body.blocks[0].height).to.equal(block.blockHeight)

          block.id = body.blocks[0].id
          block.generatorPublicKey = body.blocks[0].generator_public_key
          block.totalAmount = body.blocks[0].total_amount
          block.totalFee = body.blocks[0].total_fee
        } else {
          console.log('Request failed or blocks array is null')
        }
        done()
      })
  })

  it('Using height < 100. Should be ok', done => {
    if (testBlocksUnder100) {
      const height = 10
      node.api.get(`/blocks?height=${height}`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end((_err, {
          body
        }) => {
          // debug(JSON.stringify(body));
          node.expect(body).to.have.property('success').to.be.true
          if (body.success === true && body.blocks !== null) {
            node.expect(body).to.have.property('count')
            node.expect(body).to.have.property('blocks').that.is.an('array')
            node.expect(body.blocks.length).to.equal(1)
            node.expect(body.blocks[0]).to.have.property('previous_block')
            node.expect(body.blocks[0]).to.have.property('total_amount')
            node.expect(body.blocks[0]).to.have.property('total_fee')
            node.expect(body.blocks[0]).to.have.property('generator_id')
            node.expect(body.blocks[0]).to.have.property('confirmations')
            node.expect(body.blocks[0]).to.have.property('block_signature')
            node.expect(body.blocks[0]).to.have.property('number_of_transactions')
            node.expect(body.blocks[0].height).to.equal('10')

            block.id = body.blocks[0].id
            block.generatorPublicKey = body.blocks[0].generator_public_key
            block.totalAmount = body.blocks[0].total_amount
            block.totalFee = body.blocks[0].total_fee
            block.blockHeight = body.blocks[0].height
          } else {
            console.log('Request failed or blocks array is null')
          }
          done()
        })
    } else {
      done()
    }
  })

  it('Using generatorPublicKey. Should be ok', done => {
    const generatorPublicKey = block.generatorPublicKey
    const limit = 100
    const offset = 0
    // const orderBy = "";
    node.api.get(`/blocks?generatorPublicKey=${generatorPublicKey}&limit=${limit}&offset=${offset}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, {
        body
      }) => {
        debug('generatorPublicKey', JSON.stringify(body))
        node.expect(body).to.have.property('success').to.be.true
        node.expect(body).to.have.property('blocks').that.is.an('array')
        for (let i = 0; i < body.blocks.length; i++) {
          node.expect(body.blocks[i].generator_public_key).to.equal(block.generatorPublicKey)
        }

        done()
      })
  })

  it('Using totalFee. Should be ok', done => {
    const totalFee = block.totalFee
    const limit = 100
    const offset = 0
    node.api.get(`/blocks?totalFee=${totalFee}&limit=${limit}&offset=${offset}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, {
        body
      }) => {
        debug('/blocks?totalFee ', JSON.stringify(body.blocks[0]))
        node.expect(body).to.have.property('success').to.be.true
        node.expect(body).to.have.property('blocks').that.is.an('array')
        for (let i = 0; i < body.blocks.length; i++) {
          const result = DdnUtils.bignum.isEqualTo(body.blocks[i].total_fee, block.totalFee)
          node.expect(result).to.be.true
        }
        done()
      })
  })

  // /blocks?totalAmount=0&limit=100&offset=0
  it('Using totalAmount. Should be ok', done => {
    const totalAmount = block.totalAmount
    const limit = 100
    const offset = 0
    node.api.get(`/blocks?totalAmount=${totalAmount}&limit=${limit}&offset=${offset}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, {
        body
      }) => {
        // debug('/blocks?totalAmount ', JSON.stringify(body));
        node.expect(body).to.have.property('success').to.be.true
        node.expect(body).to.have.property('blocks').that.is.an('array')
        for (let i = 0; i < body.blocks.length; i++) {
          const result = DdnUtils.bignum.isEqualTo(body.blocks[i].total_amount, block.totalAmount)
          debug(result, body.blocks[i].total_amount, totalAmount)
          node.expect(result).to.be.true
        }

        done()
      })
  })

  it('Using previousBlock. Should be ok', done => {
    if (block.id !== null) {
      const previousBlock = block.id
      node.onNewBlock(err => {
        node.expect(err).to.be.not.ok
        node.api.get(`/blocks?previousBlock=${previousBlock}`)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .end((_err, {
            body
          }) => {
            debug(`/blocks?previousBlock=${previousBlock}`, JSON.stringify(body))
            node.expect(body).to.have.property('success').to.be.true
            node.expect(body).to.have.property('blocks').that.is.an('array')
            node.expect(body.blocks).to.have.length(1)
            node.expect(body.blocks[0].previous_block).to.equal(previousBlock)

            done()
          })
      })
    }
  })

  it('Using orderBy. Should be ok', done => {
    const orderBy = 'height:desc'
    node.api.get(`/blocks?orderBy=${orderBy}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, {
        body
      }) => {
        // debug('orderBy', JSON.stringify(body));
        node.expect(body).to.have.property('success').to.be.true
        node.expect(body).to.have.property('blocks').that.is.an('array')
        for (let i = 0; i < body.blocks.length; i++) {
          if (body.blocks[i + 1] !== null) {
            const bRet = DdnUtils.bignum.isGreaterThanOrEqualTo(body.blocks[i].height, body.blocks[i + 1].height)
            node.expect(bRet).to.be.true
          }
        }
        done()
      })
  })
})

describe('GET /blocks/get?id=', () => {
  it('Using genesisblock id. Should be ok', done => {
    const genesisblockId = genesisblock.id
    debug('genesisblockId', genesisblockId)

    node.api.get(`/blocks/get?id=${genesisblockId}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, {
        body
      }) => {
        debug('GET /blocks/id', JSON.stringify(body))
        // debug('body.block', JSON.stringify(body.block));
        node.expect(body).to.have.property('success').to.be.true
        node.expect(body).to.have.property('block').to.be.a('object')
        node.expect(body.block).to.have.property('height').to.be.a('string')
        done()
      })
  })

  it('Using unknown id. Should be fail', done => {
    const unknownId = '323463429834230556352244'

    node.api.get(`/blocks/get?id=${unknownId}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, {
        body
      }) => {
        // debug(JSON.stringify(body));
        node.expect(body).to.have.property('success').to.be.false
        node.expect(body).to.have.property('error').to.be.a('string')
        done()
      })
  })

  it('Using no id. Should be fail', done => {
    node.api.get(`/blocks/get?id=${null}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((_err, {
        body
      }) => {
        // debug(JSON.stringify(body));
        node.expect(body).to.have.property('success').to.be.false
        node.expect(body).to.have.property('error').to.be.a('string')
        done()
      })
  })
})
