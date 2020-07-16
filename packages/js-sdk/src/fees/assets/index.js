import dao from './dao'
import multisignature from './multisignature'

const getFees = {}
Object.assign(getFees, dao, multisignature)

export default getFees
