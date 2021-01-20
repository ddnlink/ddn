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

  // const validateErrors = await this.ddnSchema.validate({
  //   type: 'object',
  //   properties: {
  //     transaction_id: {
  //       type: 'string',
  //       minLength: 1,
  //       maxLength: 32
  //     },
  //     org_id: {
  //       type: 'string',
  //       minLength: 1,
  //       maxLength: 20
  //     },
  //     name: {
  //       type: 'string',
  //       minLength: 1,
  //       maxLength: 64
  //     },
  //     address: {
  //       type: 'string',
  //       minLength: 1,
  //       maxLength: 128
  //     },
  //     tags: {
  //       type: 'string',
  //       minLength: 1,
  //       maxLength: 40
  //     },
  //     url: {
  //       type: 'string',
  //       minLength: 1,
  //       maxLength: 256
  //     },
  //     state: {
  //       type: 'integer',
  //       minimum: 0,
  //       maximum: 1
  //     },
  //     timestamp: {
  //       type: 'string',
  //       minimum: 0
  //     }
  //   },
  //   required: ['transaction_id', 'org_id', 'state', 'timestamp']
  // }, org)

  // if (validateErrors) {
  //   return reject(new Error(`Invalid parameters: ${validateErrors[0].schemaPath} ${validateErrors[0].message}`))
  // }

  try {
    return await context.dao.insertOrUpdate('mem_org', org, dbTrans)
  } catch (err) {
    throw new Error(`insertOrUpdate mem_org ${err}`)
  }
}

async function getEffectiveOrg (context, where) {
  const result = await context.dao.findList('mem_org', {
    where,
    attributes: ['transaction_id', 'org_id', 'name', 'address', 'tags', 'url', 'state', 'timestamp'],
    order: ['timestamp']
  })
  return result && result[0]
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

  return await context.dao.update(
    'mem_org',
    org,
    {
      org_id: org_id.toLowerCase()
    },
    dbTrans
  )
}

export default {
  isOrgId,
  updateOrg,
  getEffectiveOrg,
  getEffectiveOrgByAddress,
  getEffectiveOrgByOrgId,
  exchangeOrg
}
