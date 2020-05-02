import Debug from 'debug';

import node from "@ddn/node-sdk/lib/test";
import crypto from '../lib';

const debug = Debug('test');
const tokenPrefix = 'D';

function isAddress(address) {
  return crypto.isAddress(address, tokenPrefix);
}

describe('address', () => {
  let Phasekey;
  let publicKey;

  it('old 64bit address should be false', done => {
    node.expect(isAddress('a')).to.be.false
    node.expect(isAddress('')).to.be.false
    node.expect(isAddress()).to.be.false
    node.expect(isAddress(1)).to.be.false
    node.expect(isAddress('1a')).to.be.false
    node.expect(isAddress('1234567890123456789012')).to.be.false

    node.expect(isAddress('1')).to.be.false
    node.expect(isAddress('123456')).to.be.false

    done()
  })

  it('bitcoin Address should be invalid', done => {
    node.expect(isAddress('14VXPK3foDitWdv132rb3dZJkJUMrMSscp')).to.be.false
    done()
  })

  it('generateSecret should be ok', done => {
    Phasekey = crypto.generateSecret();
    debug('address.test.js addr', Phasekey);
    node.expect(Phasekey).to.be.a('string');

    done()
  })

  it('getKeys should be ok', done => {
    publicKey = crypto.getKeys(Phasekey).publicKey;
    debug('address.test.js addr', publicKey);
    node.expect(publicKey).to.be.a('string');

    done()
  })

  it('Normal address should be ok', done => {
    const addr = crypto.generateAddress(publicKey, tokenPrefix);
    debug('address.test.js addr', addr);
    node.expect(isAddress(addr)).to.be.true

    done()
  })
})
