import aob from './aob'
import dao from './dao'
import dapp from './dapp'
import evidence from './evidence'

const getBytes = {}
Object.assign(getBytes, aob, dao, dapp, evidence)

export default getBytes
