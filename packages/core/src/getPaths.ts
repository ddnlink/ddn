import { join } from 'path'
import { existsSync, statSync } from 'fs'
import { IConfig } from 'umi-types'

function test (path) {
  return existsSync(path) && statSync(path).isDirectory()
}

interface IOpts {
  cwd: string;
  config: IConfig;
}

export default function (opts: IOpts) {
  const { cwd, config } = opts
  const outputPath = config.outputPath || './dist'

  let publicPath = 'public'
  if (process.env.PUBLIC_PATH) {
    publicPath = process.env.PUBLIC_PATH
  } else {
    if (test(join(cwd, 'src/public'))) {
      publicPath = 'src/public'
    }
    if (test(join(cwd, 'public'))) {
      publicPath = 'public'
    }
  }

  const absPagesPath = join(cwd, publicPath)
  const absSrcPath = join(absPagesPath, '../')

  const envAffix = process.env.NODE_ENV === 'development' ? '' : '-production'
  const tmpDirPath = process.env.DDN_TEMP_DIR
    ? `${process.env.DDN_TEMP_DIR}${envAffix}`
    : `${publicPath}/.ddn${envAffix}`

  const absTmpDirPath = join(cwd, tmpDirPath)

  return {
    cwd,
    outputPath,
    absOutputPath: join(cwd, outputPath),
    absNodeModulesPath: join(cwd, 'node_modules'),
    publicPath,
    absPagesPath,
    absSrcPath,
    tmpDirPath,
    absTmpDirPath,
    absRouterJSPath: join(absTmpDirPath, 'router.js'),
    absLibraryJSPath: join(absTmpDirPath, 'ddn.js'),
    absRegisterSWJSPath: join(absTmpDirPath, 'registerServiceWorker.js'),
    absPageDocumentPath: join(absPagesPath, 'document.ejs')
  }
}
