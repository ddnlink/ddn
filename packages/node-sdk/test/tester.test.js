import Debug from 'debug';
import node from '@ddn/node-sdk/lib/test';
import _ from 'lodash';

const debug = Debug('debug');
const expect = node.expect;

describe('An example of DDN test, please do test follow me', () => {
    it('should be ok', () => {
        const name = node.randomIssuerName('DDN.', 3);
        debug('name', name);
        expect(name).be.a('string');
    })
});

describe("Test all Utils, for example: _.isEmpty('')", () => {
    it("Should use _.isEmpty, not '' ", () => {
        const test = ' ';

        debug("Blank is empty", !!test, _.isEmpty(test));

        expect(!!test).be.true;
        expect(_.isEmpty(test)).be.false;
        expect(!!test).be.not.equal(_.isEmpty(test));
    })
})