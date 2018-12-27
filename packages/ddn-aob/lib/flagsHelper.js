const FlagsHelper = {
  FLAGS_TYPE : {
    1: {
      name: 'acl',
      range: [0, 1]
    },
    2: {
      name: 'writeoff',
      range: [1, 1]
    }
  },

  instance : {
    isValidFlagType(type) {
      return !!FLAGS_TYPE[type]
    },

    isValidFlag(type, flag) {
      const attr = FLAGS_TYPE[type];
      if (!attr) {
        return false
      }
      const range = attr.range;
      return flag >= range[0] && flag <= range[1]
    },

    isSameFlag(type, flag, values) {
      return values[FLAGS_TYPE[type].name] == flag
    },

    getTypeName(type) {
      return FLAGS_TYPE[type].name;
    },

    getAclTable(flag) {
      return flag == '0' ? 'acl_black' : 'acl_white'
    }
  }
}
module.exports = FlagsHelper;