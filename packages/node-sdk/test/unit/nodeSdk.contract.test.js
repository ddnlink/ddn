import Debug from 'debug'
import { DdnJS, node } from '../ddn-js'

const debug = Debug('debug')
const expect = node.expect

describe('node-sdk contract.js', () => {
  const contract = DdnJS.contract

  it('should be object', () => {
    expect(contract).that.is.an('object')
  })

  it('should have properties', () => {
    expect(contract).to.have.property('createContract')
  })

  describe('#createContract', () => {
    const createContract = contract.createContract
    let trs = null

    const options = {
      name: 'ddn-contract-demo',
      desc: 'a test smart contract',
      version: '1.0.0',
      gas: 0,
      code: `
      const CURRENCY = 'DDN'
      
      class Payment {
        address: string
        amount: bigint
      
        constructor(address: string, amount: bigint) {
          this.address = address
          this.amount = amount
        }
      }
      
      export class HelloContract extends SmartContract {
        private total: bigint
        private payments: Vector<Payment>
      
        constructor() {
          super()
          this.total = BigInt(0)
          this.payments = new Vector<Payment>()
        }
      
        @payable({ isDefault: true })
        onPay(amount: bigint, currency: string) {
          assert(amount > 0, 'Amount should greater than 0')
          assert(currency === CURRENCY, \`Please pay \${CURRENCY}\`)
      
          this.total += amount
          const payment = new Payment(this.context.senderAddress, amount)
          this.payments.push(payment)
        }
      
        @constant
        getPayTimes(): number {
          return this.payments.size()
        }
      
        @constant
        getTotal(): bigint {
          return this.total
        }
      }
      `
    }

    it('should be a function', () => {
      expect(createContract).to.be.a('function')
    })

    it('should create contract without second signature', async () => {
      // options.contracts = options.contracts.join(',');
      trs = await createContract(options, 'secret')
      debug('createContract: ', trs)
      expect(trs).to.be.ok
    })

    it('should create contract with second signature', async () => {
      // options.contracts = options.contracts.join(',');
      trs = await createContract(options, 'secret', 'secret 2')
      console.log(trs)
      debug('createContract: ', trs)

      expect(trs).to.be.ok
    })
  })
})
