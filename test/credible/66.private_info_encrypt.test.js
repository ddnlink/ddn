var DEBUG = require('debug')('credible')
var node = require('./../variables.js')
var crypto = require('crypto');

describe("可信区块链测试：私有信息的加密性", () => {
    var testAccount = {
        address: "ELzPRrXGDPirC6VdeiX2qpqgVyaA5k9Vdy",
        secret: "rug valve emotion supreme napkin mom skill muscle doll donate margin frost"
    }
    
    var testAccount2 = {
        address: "EyGE8iEXjWCG3st1LjobhwLW31foEZLD3",
        secret: "trade recall shy bicycle tone photo myth vote ivory party bleak raw"
    }

    var userToken = "";

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

    it("设置用户imfly的私有信息", (done) => {

        var data = {
            token: userToken,
            name: "imfly",
            mobile: "18624276062",
            email: "imfly@ddn.link",
            qq: "12151327",
            address: "北京市朝阳区朝阳Men写字中心B座2505"
        };

        console.log("用户信息修改内容：" + JSON.stringify(data));

        node.api.post("/user/update")
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

});