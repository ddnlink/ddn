
import pluralize from 'pluralize'
import _ from 'lodash'

describe('loader.js', () => {
  test('it`s ok', () => {
    const str = 'dao'
    const strs = pluralize(str)
    const strSnake = _.snakeCase(strs)
    const apiPath = strSnake.replace('_', '/')

    expect(strs).toBe('daos')
    expect(strSnake).toBe('daos')
    expect(apiPath).toBe('daos')
  })
})
