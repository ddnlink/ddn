function isOrgId(daoId) {
  if (typeof daoId !== 'string') {
    return false;
  }
  if (/^[0-9a-z_]{1,20}$/g.test(daoId)) {
    if (daoId.charAt(0) === '_' || daoId.charAt(daoId.length - 1) === '_') {
      return false; // not start or end with _
    }
    return true;
  }
  return false;
}

module.exports = {
  isOrgId,
};
