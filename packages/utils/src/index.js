import depd from 'depd'
import assetTypes from './asset-types'
import runtimeState from './runtime-states'
import amount from './amount'
import limitCache from './limit-cache'
import system from './system'
import bignum from './bignumber'
import routesMap from './routes-map'

const deprecated = depd('@ddn')

export default {
  assetTypes,
  runtimeState,
  amount,
  limitCache,
  system,
  bignum,
  routesMap,
  deprecated
}
