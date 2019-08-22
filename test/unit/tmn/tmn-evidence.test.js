var node = require('../../variables.js')

async function createPluginAsset(type, asset, secret) {
  return await node.ddn.assetPlugin.createPluginAsset(type, asset, secret)
}

describe('asset puglin Test', () => {


  // 1,创建一个新的医疗存证
  it("创建一个新的医疗存证", async (done) => {
    node.onNewBlock(async (err) => {
      node.expect(err).to.be.not.ok;
      node.ddn.init.init();
      const extend = {
        test: '测试这个扩展属性是否可以正常使用',
      };
      const tmnData = {
        hash: 'qqqwqeqweqwe123aq21Sqw))-=',
        type: 'ba',
        dia_id: 'this is a test id',
        hcode: '001',
        message: '这个是一个测试的消息属性',
        extend: JSON.stringify(extend),
      }
      const transaction = await createPluginAsset(71, tmnData, node.Eaccount.password);
      console.log('transaction', transaction)
      node.peer.post("/transactions")
        .set("Accept", "application/json")
        .set("version", node.version)
        .set("nethash", node.config.nethash)
        .set("port", node.config.port)
        .send({
          transaction: transaction
        })
        .expect("Content-Type", /json/)
        .expect(200)
        .end(function (err, res) {
          console.log('res.body', res.body);
          node.expect(res.body).to.have.property("success").to.be.true;
          done();
        });
    });
  })

  // 2,重复添加，需要添加失败
  it("重复添加，需要添加失败", async (done) => {
    node.onNewBlock(async (err) => {
      node.expect(err).to.be.not.ok;
      const extend = {
        test: '测试这个扩展属性是否可以正常使用',
      };
      const tmnData = {
        hash: 'qqqwqeqweqwe123aq21Sqw))-=',
        type: 'ba',
        dia_id: 'this is a test id',
        hcode: '001',
        message: '这个是一个测试的消息属性',
        extend: JSON.stringify(extend),
      }
      const transaction = await createPluginAsset(71, tmnData, node.Eaccount.password);
      console.log('transaction', transaction)
      node.peer.post("/transactions")
        .set("Accept", "application/json")
        .set("version", node.version)
        .set("nethash", node.config.nethash)
        .set("port", node.config.port)
        .send({
          transaction: transaction
        })
        .expect("Content-Type", /json/)
        .expect(200)
        .end(function (err, res) {
          console.log('res.body', res.body);
          node.expect(res.body).to.have.property("success").to.be.false;
          done();
        });
    });
  })

  // 3, 调用根据hash查询接口确定gethash接口是否正确
  it("调用根据hash查询接口确定gethash接口是否正确", async (done) => {
    node.onNewBlock(async (err) => {
      node.expect(err).to.be.not.ok;
      const hash = 'qqqwqeqweqwe123aq21Sqw))-=';
      node.api.get("/tmnevidence/hash/" + hash)
        .set("Accept", "application/json")
        .set("version", node.version)
        .set("nethash", node.config.nethash)
        .set("port", node.config.port)
        .expect("Content-Type", /json/)
        .expect(200)
        .end(function (err, res) {
          console.log('333333', res.body);

          done();
        });
    });
  })
});
