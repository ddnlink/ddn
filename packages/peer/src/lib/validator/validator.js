// Dependencies
import utils from './utils.js'

// Implementation
import Field from './field.js'

const extend = utils.extend

export default Validator
export { Field }

/**
 * Create validator. Options could have properties `forceAsync`, `skipMissed` and `rules`.
 * @param {object} options
 * @constructor
 */
class Validator {
  constructor (options = {}) {
    this.hasError = false

    this.forceAsync = this.forceAsync || options.forceAsync
    this.skipMissed = this.skipMissed || options.skipMissed
    this.execRules = this.execRules || options.execRules
    this.rules = extend(Object.create(this.rules), options.rules)

    let reporter = this.reporter || options.reporter
    if (typeof reporter === 'function') {
      reporter = new reporter(this)
    }

    this.reporter = reporter

    this.onInit()
  }

  /**
     * Check whether rule exists.
     * @param {string} name
     * @returns {boolean}
     */
  hasRule (name) {
    return name in this.rules
  }

  /**
     * Get rule descriptor.
     * @param {string} name
     * @returns {*}
     */
  getRule (name) {
    if (name in this.rules === false) throw new Error(`Rule "${name}" doesn't defined`)
    return this.rules[name]
  }

  /**
     * Validate values with specified rules set
     * @param {*} value
     * @param {object} rules Set of rules
     * @param {function(err:Error,report:Array,output:*)=} callback Result callback
     */
  validate (value, rules, callback) {
    const self = this

    const field = this.createField(null, value, rules)
    let async
    let finished
    let report

    report = {}

    function finish (err, issues, output) {
      finished = true

      report.isValid = !issues.length

      if (self.reporter) {
        issues = self.reporter.convert(issues, rules)
      }

      report.isAsync = async
      report.issues = issues
      report.rules = rules
      report.value = output

      if (!callback) {
        if (err) {
          throw err
        } else if (async) {
          throw new Error('Async validation without callback')
        }

        return
      }

      if (async || !callback || !self.forceAsync) {
        self.onEnd()
        callback.call(self, err, report, output)
      } else {
        setTimeout(() => {
          self.onEnd()
          callback.call(self, err, report, output)
        }, 1)
      }
    }

    async = false
    field.validate(finish)
    async = true

    if (!callback && !finished) {
      throw new Error('Validation not finished')
    }

    return report
  }

  /**
     * Create field instance
     * @param {string|string[]} path Field path
     * @param {*} value Validated value
     * @param {object} rules Rule set
     * @param {*=} thisArg This reference for Validation methods. Optional
     * @returns {Validator.Field}
     */
  createField (path, value, rules, thisArg) {
    return new this.Field(this, path, value, rules, thisArg)
  }

  // Internal event handlers
  onInit () {}

  onError (field, err) {}
  onValid (field) {}
  onInvalid (field) {}
  onEnd () {}

  // Constructor methods

  /**
     * Add validation rule descriptor to validator rule set.
     * @param {string} name Validator name
     * @param {{validate:function,filter:function}} descriptor Validator descriptor object
     */
  static addRule (name, descriptor) {
    if (typeof descriptor !== 'object') {
      throw new Error('Rule descriptor should be an object')
    }

    const self = this

    this.prototype.rules[name] = descriptor

    if (descriptor.hasOwnProperty('aliases')) {
      descriptor.aliases.forEach(alias => {
        self.addAlias(alias, name)
      })
    }
  }

  /**
     * Add rule alias
     * @param {string} name
     * @param {string} origin
     */
  static addAlias (name, origin) {
    Object.defineProperty(this.prototype.rules, name, {
      get () {
        return this[origin]
      }
    })
  }

  /**
     * Add extra property to Field. It could be
     * @param name
     * @param value
     */
  static fieldProperty (name, value) {
    this.prototype.Field.prototype[name] = value
  }

  /**
     * Validate with fast initialization. Use `options` property for constructor instance;
     * @param {*} value Validated value
     * @param {object} rules Set of rules
     * @param {object} customRules Customized rule set. Optional
     * @param {function(err:Error, report:object[], result:*)} callback Result callback
     */
  static validate (value, rules, customRules, callback) {
    if (typeof customRules === 'function') {
      callback = customRules
      customRules = {}
    }

    const instance = new this(extend({}, this.options, {
      rules: customRules
    }))

    return instance.validate(value, rules, callback)
  }
}

/**
 * Make validation async even if no async rules are used.
 * @type {boolean}
 */
Validator.prototype.forceAsync = false

/**
 * Don't throw error if rule is missed
 * @type {boolean}
 */
Validator.prototype.skipMissed = false

/**
 * If rule value is function run it to get value
 * @type {boolean}
 */
Validator.prototype.execRules = true

/**
 * Issue reporter. Convert issues.
 * @type {Reporter}
 */
Validator.prototype.reporter = null

/**
 * Validator field constructor
 * @type {Field}
 */
Validator.prototype.Field = Field

/**
 * Set of validator rule descriptors
 * @type {{}}
 */
Validator.prototype.rules = {}

/**
 * Validator instance options for fast initialization in method validate.
 * @type {{forceAsync: boolean, skipMissed: boolean}}
 */
Validator.options = {
  forceAsync: false,
  skipMissed: false,
  execRules: true,
  reporter: null
}

// Default rules

Validator.addRule('defaults', {
  description: 'Set default value if passed value is undefined',
  filter (accept, value) {
    if (typeof value === 'undefined') {
      return accept
    } else {
      return value
    }
  }
})

Validator.addRule('type', {
  description: 'Check value type',
  validate (accept, value) {
    return typeof value === accept
  }
})

Validator.addRule('equal', {
  description: 'Check if value equals acceptable value',
  validate (accept, value) {
    return value === accept
  }
})

Validator.addRule('notEqual', {
  description: 'Check if value not equals acceptable value',
  validate (accept, value) {
    return typeof value !== accept
  }
})

Validator.addRule('greater', {
  description: 'Check if value is greater then acceptable value',
  aliases: ['>', 'gt'],
  validate (accept, value) {
    return typeof value > accept
  }
})

Validator.addRule('greaterOrEqual', {
  description: 'Check if value is greater then or equal acceptable value',
  aliases: ['>=', 'gte'],
  validate (accept, value) {
    return typeof value >= accept
  }
})

Validator.addRule('less', {
  description: 'Check if value is less then acceptable value',
  aliases: ['<', 'lt'],
  validate (accept, value) {
    return typeof value < accept
  }
})

Validator.addRule('lessOrEqual', {
  description: 'Check if value is less then or equal acceptable value',
  aliases: ['<=', 'lte'],
  validate (accept, value) {
    return typeof value <= accept
  }
})

Validator.fieldProperty('isObject', function () {
  return this.value !== null && typeof this.value === 'object'
})

Validator.fieldProperty('isObjectInstance', function () {
  return this.value && typeof this.value === 'object' && this.value.constructor === Object
})

Validator.fieldProperty('isDefault', function () {
  return this.value === this.rules.defaults
})

Validator.fieldProperty('isUndefined', function () {
  return typeof this.value === 'undefined'
})

Validator.fieldProperty('isEmpty', function () {
  return typeof this.value === 'undefined' || this.value === null || this.value === ''
})
