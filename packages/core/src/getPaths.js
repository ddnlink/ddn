import path from 'path'
import fs from 'fs'

function test (path) {
  return fs.existsSync(path) && fs.statSync(path).isDirectory()
}

// interface IOpts {
//   cwd: string;
//   config: IConfig;
// }

export default function (opts) {
  const { cwd, config } = opts
  const outputPath = config.outputPath || './dist'

  let publicPath = 'public'
  if (process.env.PUBLIC_PATH) {
    publicPath = process.env.PUBLIC_PATH
  } else {
    if (test(path.join(cwd, 'src/public'))) {
      publicPath = 'src/public'
    }
    if (test(path.join(cwd, 'public'))) {
      publicPath = 'public'
    }
  }

  const absPagesPath = path.join(cwd, publicPath)
  const absSrcPath = path.join(absPagesPath, '../')

  const envAffix = process.env.NODE_ENV === 'development' ? '' : '-production'
  const tmpDirPath = process.env.DDN_TEMP_DIR
    ? `${process.env.DDN_TEMP_DIR}${envAffix}`
    : `${publicPath}/.ddn${envAffix}`

  const absTmpDirPath = path.join(cwd, tmpDirPath)

  return {
    cwd,
    outputPath,
    absOutputPath: path.join(cwd, outputPath),
    absNodeModulesPath: path.join(cwd, 'node_modules'),
    publicPath,
    absPagesPath,
    absSrcPath,
    tmpDirPath,
    absTmpDirPath,
    absRouterJSPath: path.join(absTmpDirPath, 'router.js'),
    absLibraryJSPath: path.join(absTmpDirPath, 'ddn.js'),
    absRegisterSWJSPath: path.join(absTmpDirPath, 'registerServiceWorker.js'),
    absPageDocumentPath: path.join(absPagesPath, 'document.ejs')
  }
}
