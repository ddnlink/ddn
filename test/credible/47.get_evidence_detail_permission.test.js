var DEBUG = require('debug')('credible')
var node = require('./../variables.js')
var crypto = require('crypto');

var createEvidence = node.ddn.evidence.createEvidence;

describe("可信区块链测试：用户分级分类数据访问权限控制管理", () => {

    const ipid = node.randomIpId();
    evidence = {
      "ipid": ipid,
      "title": node.randomUsername(),
      "description": ipid + " has been evidence.",
      "hash": "f082022ee664008a1f15d62514811dfd",
      "author": "Evanlai",
      "size": "2448kb",
      "type": "html",
      "url": "dat://f76e1e82cf4eab4bf173627ff93662973c6fab110c70fb0f86370873a9619aa6+18/public/test.html",
      "tags": "world,cup,test"
    }

    before(function (done) {
        var transaction = createEvidence(evidence, node.Gaccount.password);

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
          node.expect(res.body).to.have.property("success").to.be.true;
          done();
        });
    });

    var testAccount = {
        address: "ELzPRrXGDPirC6VdeiX2qpqgVyaA5k9Vdy",
        secret: "rug valve emotion supreme napkin mom skill muscle doll donate margin frost"
    }
    
    var testAccount2 = {
        address: "EyGE8iEXjWCG3st1LjobhwLW31foEZLD3",
        secret: "trade recall shy bicycle tone photo myth vote ivory party bleak raw"
    }

    var userToken = "";

    it("", (done)=> {
        node.onNewBlock(err => {
            node.expect(err).to.be.not.ok;
            done();
        });
    })

    it("使用未授权用户登录，获取Token", (done) => {

        var md5 = crypto.createHash('md5');
        var data = {
            secret: testAccount.secret,
            name: "imfly",
            pass: md5.update('112233').digest('hex')
        };

        console.log("登录用户参数：" + JSON.stringify(data));

        node.api.post("/user/login")
            .set('Accept', 'application/json')
            .send(data)
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
                console.log(JSON.stringify(res.body));
                node.expect(res.body).to.have.property('success').to.be.true;

                userToken = res.body.token;

                done();
            });

    });

    it("使用未授权用户的Token请求指定存证的详情", (done) => {

        node.api.get("/evidence/detail/" + ipid + "?token=" + userToken)
        .set("Accept", "application/json")
        .set("version", node.version)
        .set("nethash", node.config.nethash)
        .set("port", node.config.port)
        .expect("Content-Type", /json/)
        .expect(200)
        .end(function (err, res) {
          console.log(JSON.stringify(res.body));
          node.expect(res.body).to.have.property('success').to.be.false;

          done();
        });

    });

    it("给未授权用户设置查看存证详情的权限", (done) => {
        var md5 = crypto.createHash('md5');
        var data = {
            secret: testAccount.secret,
            name: "admin",
            pass: md5.update('111111').digest('hex'),
            userName: "imfly",
            add: ["/api/evidence/detail"],
            remove: []
        };

        node.api.post("/user/permission/set")
        .set('Accept', 'application/json')
        .send(data)
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
            console.log(JSON.stringify(res.body));
            node.expect(res.body).to.have.property('success').to.be.true;

            done();
        });

    });

    it("重新使用已设置权限的用户Token请求指定存证的详情", (done) => {

        node.api.get("/evidence/detail/" + ipid + "?token=" + userToken)
        .set("Accept", "application/json")
        .set("version", node.version)
        .set("nethash", node.config.nethash)
        .set("port", node.config.port)
        .expect("Content-Type", /json/)
        .expect(200)
        .end(function (err, res) {
          console.log(JSON.stringify(res.body));
          node.expect(res.body).to.have.property('success').to.be.true;

          done();
        });

    });

});