import _ from 'underscore';
import bignum from 'bignum-utils';
import ddnUtils from 'ddn-utils';

async function getAssets(thisFun, superFun, where, pageIndex, pageSize) {
  let result; // 最后返回的值
  // (1)查询到asset的数据列表
  result = await superFun.queryAsset(where, null, null, pageIndex, pageSize, 76);
  // (2)查询到issuer的数据列表
  let issuerData = await superFun.queryAsset({
    $in: _.pluck(result, 'issuer_name'),
  }, null, null, 1, 1000, 75);
  issuerData = _.indexBy(issuerData, 'name');
  result = _.map(result, (num) => {
    const num2 = num;
    num2.issuer_id = issuerData[num.issuer_name].issuer_id;
    return num2;
  });
  // (3)查询到交易的相关数据
  let trData = await thisFun.dao.findList('tr', {
    id: {
      $in: _.pluck(result, 'transaction_id'),
    },
  }, 1000, null, null, ['id', 'block_id'], null);
  trData = _.indexBy(trData, 'id');
  result = _.map(result, (num) => {
    const num2 = num;
    num2.block_id = trData[num.transaction_id].block_id;
    return num2;
  });
  // (4)查询到块的相关数据
  let blockData = await thisFun.dao.findList('block', {
    id: {
      $in: _.pluck(result, 'block_id'),
    },
  }, 1000, null);
  blockData = _.indexBy(blockData, 'id');
  result = _.map(result, (num) => {
    const num2 = num;
    num2.height = blockData[num.block_id].height;
    return num2;
  });
  // 循环整合验证数据
  for (let i = 0; i < result.length; i += 1) {
    const { precision } = result[i];
    result[i].maximum = bignum.new(result[i].maximum).toString(10);
    result[i].maximumShow = ddnUtils.Amount.calcRealAmount(result[i].maximum, precision);
    result[i].quantity = bignum.new(result[i].quantity).toString(10);
    result[i].quantityShow = ddnUtils.Amount.calcRealAmount(result[i].quantity, precision);
  }
  // 返回最终值
  return result;
}

function foo() {
  console.log('111');
}

export {
  getAssets,
  foo,
};
