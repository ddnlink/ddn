var DEBUG = require('debug')('credible')
var node = require('./../variables.js')
var crypto = require('crypto');

describe("可信区块链测试：数据传输方式", () => {
    var testAccount = {
        address: "ELzPRrXGDPirC6VdeiX2qpqgVyaA5k9Vdy",
        secret: "rug valve emotion supreme napkin mom skill muscle doll donate margin frost"
    }
    
    var testAccount2 = {
        address: "EyGE8iEXjWCG3st1LjobhwLW31foEZLD3",
        secret: "trade recall shy bicycle tone photo myth vote ivory party bleak raw"
    }

    var userToken = "";

    it("没有授权Token的情况下获取imfly用户信息，获取信息成功，但数据加密显示", (done) => {

        node.api.get("/user/imfly?token=" + userToken)
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

    })

    it("使用注册用户imfly登录，获取Token", (done) => {

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

    it("使用imfly的登录Token再次查询imfly的用户信息，成功获取明文数据", (done) => {

        node.api.get("/user/imfly?token=" + userToken)
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

    })

});