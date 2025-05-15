import Contract from './register'
import ContractPay from './pay'
import ContractTransfer from './call'

export { Energy } from './energy';

export default {
  Contract, // register type: 11
  ContractTransfer, // call type: 12,
  ContractPay // pay type: 13
}
