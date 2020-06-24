import { join } from 'path'
import getPaths from '../lib/getPaths'

const fixtures = join(__dirname, 'fixtures/getPaths')

test('normal', () => {
  const paths = getPaths({
    cwd: join(fixtures, 'normal'),
    config: {}
  })
  expect(paths.outputPath).toEqual('./dist')
})

test('DDN_TEMP_DIR env', () => {
  process.env.DDN_TEMP_DIR = 'foooo'
  const paths = getPaths({
    cwd: join(fixtures, 'normal'),
    config: {}
  })
  expect(paths.tmpDirPath).toEqual('foooo-production')
  process.env.DDN_TEMP_DIR = ''
})
