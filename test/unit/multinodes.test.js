'use strict';

var DEBUG = require('debug')('multinodes');
var node = require("./../variables.js");
var async = require('async');

var urls = [
    "http://127.0.0.1:8001",
    "http://127.0.0.1:8002",
    "http://127.0.0.1:8003",
    "http://127.0.0.1:8004"
]

describe("GET /blocks/getHeight in multi nodes", function () {

    it("Should be same height", function (done) {
        async.mapSeries(urls, node._getheight, function (err, results) {
            DEBUG('heights', results);
            if (!err) {
                let items = new Set(results);
                node.expect(items.size).to.equal(1);
            } else {
                console.log('getHeight in multi nodes error')
            }
            done();
        });
    });
});
