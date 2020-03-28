const DEBUG = require('debug')('multinodes');
import node from "../node";
import async from 'async';

const urls = [
    "http://127.0.0.1:8001",
    "http://127.0.0.1:8002",
    "http://127.0.0.1:8003",
    "http://127.0.0.1:8004"
];

describe("GET /blocks/getHeight in multi nodes", () => {

    it("Should be same height", done => {
        async.mapSeries(urls, node._getheight, (err, results) => {
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
