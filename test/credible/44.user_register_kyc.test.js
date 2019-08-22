var DEBUG = require('debug')('credible')
var node = require('./../variables.js')
var crypto = require('crypto');

describe("可信区块链测试：用户注册时的身份验证", () => {

    var testAccount = {
        address: "ELzPRrXGDPirC6VdeiX2qpqgVyaA5k9Vdy",
        secret: "rug valve emotion supreme napkin mom skill muscle doll donate margin frost"
    }

    it("使用错误的身份证信息进行注册", (done) => {

        var md5 = crypto.createHash('md5');
        var userInfo = {
            secret: testAccount.secret,
            wallet: testAccount.address,
            name: "imfly",
            pass: md5.update('112233').digest('hex'),
            realname: "朱测试",
            idcard: "110102197810272321",
            idcardImage: "http://www.ebookchain.org/static/media/idcard_test.jpg"
        };

        console.log("注册人信息：" + JSON.stringify(userInfo));

        node.api.put("/user/register", )
            .set('Accept', 'application/json')
            .send(userInfo)
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
                console.log(JSON.stringify(res.body));
                node.expect(res.body).to.have.property('success').to.be.false;

                done();
            });
    });

    it("使用正确的身份证信息进行注册", (done) => {
        var md5 = crypto.createHash('md5');
        var userInfo = {
            secret: testAccount.secret,
            wallet: testAccount.address,
            name: "imfly",
            pass: md5.update('112233').digest('hex'),
            realname: "朱志文",
            idcard: "372901197905065419",
            idcardImage: "http://www.ebookchain.org/static/media/idcard_test.jpg"
        };

        console.log("注册人信息：" + JSON.stringify(userInfo));

        node.api.put("/user/register", )
            .set('Accept', 'application/json')
            .send(userInfo)
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
                console.log(JSON.stringify(res.body));
                node.expect(res.body).to.have.property('success').to.be.true;

                done();
            });
    });

    it("再次使用正确的身份证信息进行注册", (done) => {
        var md5 = crypto.createHash('md5');
        var userInfo = {
            secret: testAccount.secret,
            wallet: testAccount.address,
            name: "imfly",
            pass: md5.update('112233').digest('hex'),
            realname: "朱志文",
            idcard: "372901197905065419",
            idcardImage: "http://www.ebookchain.org/static/media/idcard_test.jpg"
        };

        console.log("注册人信息：" + JSON.stringify(userInfo));

        node.api.put("/user/register", )
            .set('Accept', 'application/json')
            .send(userInfo)
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
                console.log(JSON.stringify(res.body));
                node.expect(res.body).to.have.property('success').to.be.false;

                done();
            });
    });

});