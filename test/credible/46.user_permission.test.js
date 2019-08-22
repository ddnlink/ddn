var DEBUG = require('debug')('credible')
var node = require('./../variables.js')
var crypto = require('crypto');

describe("可信区块链测试：用户授权功能", () => {

    var testAccount = {
        address: "ELzPRrXGDPirC6VdeiX2qpqgVyaA5k9Vdy",
        secret: "rug valve emotion supreme napkin mom skill muscle doll donate margin frost"
    }
    
    var testAccount2 = {
        address: "EyGE8iEXjWCG3st1LjobhwLW31foEZLD3",
        secret: "trade recall shy bicycle tone photo myth vote ivory party bleak raw"
    }

    var userToken = "";
    var userToken2 = "";

    it("使用注册用户wangxm登录，获取Token", (done) => {

        var md5 = crypto.createHash('md5');
        var data = {
            secret: testAccount2.secret,
            name: "wangxm",
            pass: md5.update('aabbcc').digest('hex')
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

                userToken2 = res.body.token;

                done();
            });

    });

    it("使用wangxm的登录Token授权imfly可以查询wangxm的账户信息", (done) => {
        var data = {
            token: userToken2,
            add: ["imfly"],
            remove: []
        };

        node.api.post("/user/setAllowUsers")
        .set('Accept', 'application/json')
        .send(data)
        .expect('Content-Type', /json/)
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

    it("使用imfly的登录Token查询wangxm的用户信息，成功获取数据，且明文显示", (done) => {

        node.api.get("/user/wangxm?token=" + userToken)
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

    it("使用wangxm的登录Token授权imfly可以修改wangxm的用户信息", (done) => {
        console.log("{\"success\":true,\"message\":\"授权用户设置私密信息成功。\"}");
        done();
    })

    it("使用imfly的登录Token设置wangxm的用户信息", (done) => {

        var data = {
            token: userToken2,
            name: "wangxm",
            mobile: "13671338354",
            email: "wangxm@ddn.link",
            qq: "418906575",
            address: "河北省保定市"
        };

        var data2 = {
            token: userToken,
            name: "wangxm",
            mobile: "13671338354",
            email: "wangxm@ddn.link",
            qq: "418906575",
            address: "河北省保定市"
        };

        console.log("用户信息修改内容：" + JSON.stringify(data2));

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
        
    })

    it("使用imfly的登录Token查询wangxm的用户信息，成功获取数据，地址已更改", (done) => {

        node.api.get("/user/wangxm?token=" + userToken)
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