import Debug from 'debug';
import node from '@ddn/node-sdk/lib/test';

const debug = Debug('debug');
const expect = node.expect;

describe('test.js', () => {
    it('should be ok', () => {
        const name = node.randomIssuerName('DDN.', 3);
        debug('name', name);
        expect(name).be.a('string');
    })
});