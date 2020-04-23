import Debug from 'debug';
import DdnUtil from '@ddn/utils';
import node from '@ddn/node-sdk/lib/test';

const debug = Debug('evidence');

// 这里有两种创建存证交易的方法
const createEvidence = node.ddn.evidence.createEvidence;

async function createPluginAsset(type, asset, secret) {
  return await node.ddn.assetPlugin.createPluginAsset(type, asset, secret)
}


describe('Test createEvidence', () => {

  let transaction;
  let evidence;
  
  beforeAll(done => {
    const ipid = node.randomIpId();
    evidence = {
      "ipid": ipid,
      "title": node.randomUsername(),
      "description": `${ipid} has been evidence.`,
      "hash": "f082022ee664008a1f15d62514811dfd",
      "author": "Evanlai",
      "size": "2448kb",
      "type": "html",
      "url": "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
      "tags": "world,cup,test"
    }

    done();
  })

  it("CreateEvidence Should be ok", done => {
    transaction = createEvidence(evidence, node.Gaccount.password);

    node.peer.post("/transactions")
      .set("Accept", "application/json")
      .set("version", node.version)
      .set("nethash", node.config.nethash)
      .set("port", node.config.port)
      .send({
        transaction
      })
      .expect("Content-Type", /json/)
      .expect(200)
      .end((err, {body}) => {
        debug(JSON.stringify(body));
        node.expect(body).to.have.property("success").to.be.true;
        done();
      });
  });

  it('Get /evidences/:ipid should be ok', done => {
    node.onNewBlock(err => {
      node.api.get(`/evidences/${evidence.ipid}`)
        .set("Accept", "application/json")
        .set("version", node.version)
        .set("nethash", node.config.nethash)
        .set("port", node.config.port)
        .expect("Content-Type", /json/)
        .expect(200)
        .end((err, {body}) => {
          debug(JSON.stringify(body.transaction));
          node.expect(body).to.have.property('success').to.be.true;
          node.expect(body).to.have.property('transaction');

          node.expect(body.transaction.fee).to.equal(transaction.fee);
          node.expect(body.transaction.recipientId).to.equal('');
          node.expect(body.transaction.type).to.equal(transaction.type);
          node.expect(body.transaction.asset.evidence.type).to.equal(transaction.asset.evidence.type);

          done();
        });
    })
  })
})


describe('Asset puglin Test', () => {

  const ipid = `ipid${new Date().getTime()}`;

  it("POST peers/transactions, Should be ok", async () => {
      node.ddn.init();

      const assetEvidence = {
          ipid,
          title: "新增资产说明文档",
          hash: "askdfh12483ashkjfdh128347ahsdfjk1",
          author: "wangxm",
          url: "http://www.ebookchain.org",
          type: ".doc",

          //amount: "1000000000",
          receive_address: node.Daccount.address,

          ext: "china",
          ext1: 12345,
          ext2: new Date()
      };
  
      const transaction = await createPluginAsset(DdnUtil.assetTypes.EVIDENCE, assetEvidence, node.Gaccount.password);

      await new Promise((resolve, reject) => {
          node.peer.post("/transactions")
              .set("Accept", "application/json")
              .set("version", node.version)
              .set("nethash", node.config.nethash)
              .set("port", node.config.port)
              .send({
                  transaction
              })
              .expect("Content-Type", /json/)
              .expect(200)
              .end((err, {body}) => {
                  // console.log(JSON.stringify(res.body));

                  node.expect(body).to.have.property("success").to.be.true;

                  if (err) {
                      reject(err);
                  } else {
                      resolve();
                  }
          });
      });
  });

  // it("POST peers/transactions agin, Should fail", async () => {
  //     const assetEvidence = {
  //         ipid,
  //         title: "新增资产说明文档",
  //         hash: "askdfh12483ashkjfdh128347ahsdfjk1",
  //         author: "wangxm",
  //         url: "http://www.ebookchain.org",
  //         type: ".doc",

  //         //amount: "1000000000",
  //         receive_address: node.Daccount.address,

  //         ext: "china",
  //         ext1: 12345,
  //         ext2: new Date()
  //     };
  
  //     const transaction = await createPluginAsset(DdnUtil.assetTypes.EVIDENCE, assetEvidence, node.Gaccount.password);

  //     await new Promise((resolve, reject) => {
  //         node.peer.post("/transactions")
  //             .set("Accept", "application/json")
  //             .set("version", node.version)
  //             .set("nethash", node.config.nethash)
  //             .set("port", node.config.port)
  //             .send({
  //                 transaction
  //             })
  //             .expect("Content-Type", /json/)
  //             .expect(200)
  //             .end((err, {body}) => {
  //                 // console.log(JSON.stringify(res.body));

  //                 node.expect(body).to.have.property("success").to.be.false;

  //                 if (err) {
  //                     reject(err);
  //                 } else {
  //                     resolve();
  //                 }
  //         });
  //     });
  // });

});