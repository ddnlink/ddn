/* ---------------------------------------------------------------------------------------------
 *  Updated by Imfly on Sat Dec 07 2019 09:30:48
 *
 *  Copyright (c) 2019 DDN FOUNDATION. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

function isOrgId (daoId) {
  if (typeof daoId !== 'string') {
    return false
  }
  if (/^[0-9a-z_]{1,20}$/g.test(daoId)) {
    if (daoId.charAt(0) === '_' || daoId.charAt(daoId.length - 1) === '_') {
      return false // not start or end with _
    }
    return true
  }
  return false
}

async function updateOrg (context, org, dbTrans) {
  if (org.org_id) {
    org.org_id = org.org_id.toLowerCase()
  }

  return new Promise((resolve, reject) => {
    context.dao.insertOrUpdate('mem_org', org, dbTrans, (err, result) => {
      if (err) {
        return reject(err)
      }

      resolve(result)
    })
  })
}

async function getEffectiveOrg (context, where) {
  return new Promise((resolve, reject) => {
    context.dao.findList('mem_org', where,
      ['transaction_id', 'org_id', 'name', 'address', 'tags', 'url', 'state', 'timestamp'],
      ['timestamp'],
      (err, result) => {
        if (err) {
          return reject(err)
        }

        resolve(result[0])
      })
  })
}

async function getEffectiveOrgByAddress (context, address) {
  return await getEffectiveOrg(context, {
    address: address
  })
}

async function getEffectiveOrgByOrgId (context, org_id) {
  return await getEffectiveOrg(context, {
    org_id: org_id.toLowerCase()
  })
}

async function exchangeOrg (context, org_id, address, dbTrans) {
  const org = {
    address: address,
    state: 1
  }

  return new Promise((resolve, reject) => {
    context.dao.update('mem_org', org, {
      org_id: org_id.toLowerCase()
    },
    dbTrans, (err, result) => {
      if (err) {
        return reject(err)
      }

      resolve(result)
    })
  })
}

export default {
  isOrgId,
  updateOrg,
  getEffectiveOrg,
  getEffectiveOrgByAddress,
  getEffectiveOrgByOrgId,
  exchangeOrg
}
