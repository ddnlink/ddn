const address = {
  isAddress: (address) => {
    if (typeof address !== 'string') {
      return false
    }
    if (/^[0-9]{1,20}$/g.test(address)) {
      return true
    }
    if (!base58check.decodeUnsafe(address.slice(1))) {
      return false
    }

    if ([constants.tokenPrefix].indexOf(address[0]) == -1) {
      return false
    }
    return true;
  },
}

module.exports = address;