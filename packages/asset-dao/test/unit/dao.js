// passed
import Debug from 'debug'
import DdnUtils from '@ddn/utils'
import node from '@ddn/node-sdk/lib/test'

const debug = Debug('debug')

const Gaccount = node.Gaccount

jest.setTimeout(50000)

export const Dao = () => {
  describe('Test Dao', () => {
    // 通用接口
    describe('post /peer/transactions', () => {
      // Common api
      it('Using valid parameters to create a org_id is ok.', async done => {
        const orgs = {
          org_id: node.randomOrgId().toLowerCase(),
          name: node.randomUsername(),
          state: 0,
          url:
            'dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html',
          tags: 'world,cup,test',
          address: Gaccount.address
        }

        // const transaction = createOrg(orgs, Gaccount.password);
        const transaction = await node.ddn.assetPlugin.createPluginAsset(
          DdnUtils.assetTypes.DAO_ORG,
          orgs,
          Gaccount.password
        )
        debug('valid parameters ok, trs:', transaction)

        node.peer
          .post('/transactions')
          .set('Accept', 'application/json')
          .set('version', node.version)
          .set('nethash', node.config.nethash)
          .set('port', node.config.port)
          .send({
            transaction
          })
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, { body }) => {
            debug('valid parameters ok', JSON.stringify(body))
            node.expect(err).to.be.not.ok
            node.expect(body).to.have.property('success').to.be.true
            done()
          })
      })

      // Common api
      it('Fee is less to create a org_id is fail.', async done => {
        const orgs = {
          org_id: node.randomOrgId().toLowerCase(),
          name: node.randomUsername(),
          state: 0,
          url:
            'dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html',
          tags: 'world,cup,test',
          address: node.Eaccount.address
        }
        const transaction = await node.ddn.assetPlugin.createPluginAsset(
          40,
          orgs,
          node.Eaccount.password
        )
        node.peer
          .post('/transactions')
          .set('Accept', 'application/json')
          .set('version', node.version)
          .set('nethash', node.config.nethash)
          .set('port', node.config.port)
          .send({
            transaction
          })
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, { body }) => {
            debug('Fee is less', JSON.stringify(body))

            node.expect(err).to.be.not.ok
            node.expect(body).to.have.property('success').to.be.false
            node.expect(body.error).to.include('Insufficient balance')

            done()
          })
      })
    })

    // 创建组织号
    describe('PUT /api/dao/orgs to create a org_id', () => {
      let org

      beforeAll(done => {
        org = {
          org_id: node.randomOrgId(),
          // "org_id": node.randomOrgId(),
          name: node.randomUsername(),
          state: 0, // Default to create
          url:
            'dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html',
          tags: 'world,cup,test'
        }

        done()
      })

      it('Using valid parameters, should be ok.', done => {
        node.api
          .put('/dao/orgs')
          .set('Accept', 'application/json')
          .send({
            secret: Gaccount.password,
            org_id: org.org_id,
            // org_id: org.org_id,
            name: org.name,
            url: org.url,
            state: 0,
            tags: org.tags
          })
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, { body }) => {
            debug('put /api/dao/orgs', JSON.stringify(body))
            node.expect(err).to.be.not.ok
            node.expect(body).to.have.property('success').to.be.true
            node.expect(body).to.have.property('transactionId')
            done()
          })
      })

      //  change name
      it('Update the Org`s name in the save 10s is fail', done => {
        node.api
          .put('/dao/orgs')
          .set('Accept', 'application/json')
          .send({
            secret: Gaccount.password,
            org_id: org.org_id,
            name: node.randomUsername(),
            state: 1,
            tags: org.tags
          })
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, { body }) => {
            debug('Update the Org`s name in the save 10s', JSON.stringify(body))
            node.expect(err).to.be.not.ok

            node.expect(body).to.have.property('success').to.be.false
            node
              .expect(body)
              .to.have.property('error')
              .include(`Org ${org.org_id.toLowerCase()} not exists`)
            done()
          })
      })

      it('Get /dao/orgs/:org_id when Org`s name is not modified should be ok', done => {
        node.onNewBlock(err => {
          node.expect(err).to.be.not.ok
          node.api
            .get(`/dao/orgs/${org.org_id.toLowerCase()}`)
            .set('Accept', 'application/json')
            .set('version', node.version)
            .set('nethash', node.config.nethash)
            .set('port', node.config.port)
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, { body }) => {
              debug('Org`s name is not modified ok', JSON.stringify(body))
              node.expect(err).to.be.not.ok

              node.expect(body).to.have.property('success').to.be.true
              node
                .expect(body)
                .to.have.property('result')
                .that.is.an('object')
              node
                .expect(body.result)
                .to.have.property('org')
                .that.is.an('object')

              node.expect(body.result.org).to.have.property('transaction_id')
              node.expect(body.result.org).to.have.property('org_id')

              node
                .expect(body.result.org.org_id)
                .to.equal(org.org_id.toLowerCase())
              node.expect(body.result.org.name).to.equal(org.name)
              node.expect(body.result.org.state).to.equal(org.state)

              done()
            })
        })
      })

      it('Update the Org`s name in a new block is ok', done => {
        const newName = node.randomUsername()
        debug('newname ', newName)

        node.onNewBlock(err => {
          node.expect(err).to.be.not.ok

          node.api
            .put('/dao/orgs')
            .set('Accept', 'application/json')
            .send({
              secret: Gaccount.password,
              org_id: org.org_id,
              name: newName,
              state: 1, // 允许修改
              tags: org.tags
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .end(async (err, { body }) => {
              debug('Update the Org`s name ok', JSON.stringify(body))
              node.expect(err).to.be.not.ok

              node.expect(body).to.have.property('success').to.be.true
              node.expect(body).to.have.property('transactionId')

              done()
            })
        })
      })

      it('Get /dao/orgs/:org_id should be ok if Org`s name has been modified', done => {
        node.onNewBlock(err => {
          node.expect(err).to.be.not.ok

          node.api
            .get(`/dao/orgs/${org.org_id.toLowerCase()}`)
            .set('Accept', 'application/json')
            .set('version', node.version)
            .set('nethash', node.config.nethash)
            .set('port', node.config.port)
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, { body }) => {
              debug('Org`s name is modified ok', JSON.stringify(body))
              node.expect(err).to.be.not.ok

              node.expect(body).to.have.property('success').to.be.true
              node
                .expect(body)
                .to.have.property('result')
                .that.is.an('object')
              node
                .expect(body.result)
                .to.have.property('org')
                .that.is.an('object')

              node.expect(body.result.org).to.have.property('transaction_id')
              node.expect(body.result.org).to.have.property('org_id')

              node
                .expect(body.result.org.org_id)
                .to.equal(org.org_id.toLowerCase())
              node.expect(body.result.org.name).to.not.equal(org.name) // name 已经更改
              node.expect(body.result.org.state).to.equal(1)
              node.expect(body.result.org.state).to.not.equal(org.state)

              done()
            })
        })
      })

      // change tags
      it('Update the org_id`s tags in a new block is ok', done => {
        node.onNewBlock(err => {
          node.expect(err).to.be.not.ok
          node.api
            .put('/dao/orgs')
            .set('Accept', 'application/json')
            .send({
              secret: Gaccount.password,
              org_id: org.org_id.toLowerCase(),
              // org_id: org.org_id,
              // name: node.randomUsername(),
              tags: `${org.tags}, add`,
              state: 1
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, { body }) => {
              // console.log(JSON.stringify(res.body));
              node.expect(err).to.be.not.ok

              node.expect(body).to.have.property('success').to.be.true
              node.expect(body).to.have.property('transactionId')
              done()
            })
        })
      })

      // org_id < 20
      it(' "org_id" more than 20, should be fails. ', done => {
        node.api
          .put('/dao/orgs')
          .set('Accept', 'application/json')
          .send({
            secret: Gaccount.password,
            org_id: `${org.org_id}asdefasdfs123456789M`,
            // org_id: org.org_id + "asdefasdfs123456789M",
            name: org.name,
            url: org.url,
            state: org.state,
            tags: org.tags
          })
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, { body }) => {
            // console.log(JSON.stringify(res.body));
            node.expect(err).to.be.not.ok

            node.expect(body).to.have.property('success').to.be.false
            node
              .expect(body.error)
              .to.equal(
                'Invalid parameters: #/properties/org_id/maxLength should NOT be longer than 20 characters'
              )
            done()
          })
      })

      it('Fee is less, should be fails. ', done => {
        node.api
          .put('/dao/orgs')
          .set('Accept', 'application/json')
          .send({
            secret: node.Eaccount.password,
            org_id: node.randomOrgId(),
            name: org.name,
            url: org.url,
            state: org.state,
            tags: org.tags
          })
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, { body }) => {
            // console.log(JSON.stringify(res.body));
            node.expect(err).to.be.not.ok

            node.expect(body).to.have.property('success').to.be.false
            node.expect(body.error).to.include('Insufficient balance')
            done()
          })
      })

      // it('Using valid parameters. Should be ok', function (done) {
      //     node.onNewBlock(function (err) {
      //         node.expect(err).to.be.not.ok;
      //         var amountToSend = 100000000;
      //         node.api.put('/transactions')
      //             .set('Accept', 'application/json')
      //             .send({
      //                 secret: Account1.password,
      //                 amount: amountToSend,
      //                 recipientId: Account2.address
      //             })
      //             .expect('Content-Type', /json/)
      //             .expect(200)
      //             .end(function (err, res) {
      //                 // console.log(JSON.stringify(res.body));
      //                 node.expect(res.body).to.have.property('success').to.be.true;
      //                 node.expect(res.body).to.have.property('transactionId');
      //                 if (res.body.success === true && res.body.transactionId !== null) {
      //                     expectedFee = node.expectedFee(amountToSend);
      //                     Account1.balance -= (amountToSend + expectedFee);
      //                     Account2.balance += amountToSend;
      //                     Account1.transactions.push(transactionCount);
      //                     transactionList[transactionCount] = {
      //                         'sender': Account1.address,
      //                         'recipient': Account2.address,
      //                         'brutoSent': (amountToSend + expectedFee) / node.normalizer,
      //                         'fee': expectedFee / node.normalizer,
      //                         'nettoSent': amountToSend / node.normalizer,
      //                         'txId': res.body.transactionId,
      //                         'type': node.TxTypes.TRANSFER
      //                     }
      //                     transactionCount += 1;
      //                 } else {
      //                     // console.log('Failed Tx or transactionId is null');
      //                     // console.log('Sent: secret: ' + Account1.password + ', amount: ' + amountToSend + ', recipientId: ' + Account2.address);
      //                     node.expect('TEST').to.equal('FAILED');
      //                 }
      //                 done();
      //             });
      //     });
      // });
    }) // end describe

    // 查询接口
    describe('GET api/dao', () => {
      it('No params should be ok', done => {
        node.api
          .get('/dao/orgs')
          .set('Accept', 'application/json')
          .set('version', node.version)
          .set('nethash', node.config.nethash)
          .set('port', node.config.port)
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, { body }) => {
            debug(JSON.stringify(body))
            node.expect(err).to.be.not.ok

            node.expect(body).to.have.property('success').to.be.true

            node
              .expect(body)
              .to.have.property('result')
              .that.is.an('object')

            node
              .expect(body.result)
              .to.have.property('rows')
              .that.is.an('array')
            node.expect(body.result).to.have.property('total')

            done()
          })
      })

      it('Given filter should be ok', done => {
        node.api
          .get('/dao/orgs?pagesize=10&pageindex=1')
          .set('Accept', 'application/json')
          .set('version', node.version)
          .set('nethash', node.config.nethash)
          .set('port', node.config.port)
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, { body }) => {
            debug('Given filter ok', JSON.stringify(body))
            node.expect(err).to.be.not.ok

            node.expect(body).to.have.property('success').to.be.true
            node
              .expect(body)
              .to.have.property('result')
              .that.is.an('object')

            if (body.result) {
              node
                .expect(body.result)
                .to.have.property('rows')
                .that.is.an('array')
              node.expect(body.result).to.have.property('total')
            }

            done()
          })
      })
    })
  })
}
