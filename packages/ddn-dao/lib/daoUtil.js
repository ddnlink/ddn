module.exports = {
  isOrgId(dao_id) {
    if (typeof dao_id !== 'string') {
      return false
    }
    if (/^[0-9a-z_]{1,20}$/g.test(dao_id)) {
      if (dao_id.charAt(0) == '_' || dao_id.charAt(dao_id.length-1) == '_') {
        return false // not start or end with _
      }else{
        return true
      }
      
    } else {
      return false
    }
  },

}