import depd from 'depd'
import assetTypes from './asset-types'
import runtimeState from './runtime-states'
import amount from './amount'
import LimitCache from './limit-cache'
import system from './system'
import bignum from './bignumber'
import routesMap from './routes-map'

import Tester from './tester'

const deprecated = depd('@ddn')

export default {
  Tester,
  LimitCache,
  assetTypes,
  runtimeState,
  amount,
  system,
  bignum,
  routesMap,
  deprecated
}
