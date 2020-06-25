var path = require('path')
var util = require('util')
var moment = require('moment')
var gulp = require('gulp')
var shell = require('gulp-shell')
var replace = require('gulp-replace')
var webpack = require('webpack')
var nodeExternals = require('webpack-node-externals')
var packageFile = require('./package')
// var UglifyJsPlugin = require('uglifyjs-webpack-plugin')

var format = util.format
var buildTime = moment().format('HH:mm:ss DD/MM/YYYY')

function build (osName, net) {
  var dir = packageFile.name + '-' + osName + '-' + packageFile.version + '-' + net
  var fullpath = path.join(__dirname, 'build', dir)

  return webpack(require('./webpack.config.js')(fullpath), function () {
    gulp.src(path.join(fullpath, 'app.js'))
      .pipe(replace('localnet', net))
      .pipe(replace('development', buildTime))
      .pipe(gulp.dest(fullpath))
      .pipe(shell(getCmds(osName, net)))
  })
}

function buildSource (net) {
  var dir = packageFile.name + '-' + 'linux' + '-' + packageFile.version + '-' + net
  var fullpath = path.join(__dirname, 'build', dir)

  return gulp.src('app.js')
    .pipe(webpack({
      output: {
        filename: 'app.js'
      },
      target: 'node',
      context: __dirname,
      node: {
        __filename: true,
        __dirname: true
      },
      externals: [nodeExternals()],
      plugins: [
        // new UglifyJsPlugin()
      ]
    }))
    .pipe(replace('localnet', net))
    .pipe(replace('development', buildTime))
    .pipe(gulp.dest(fullpath))
}

function getCmds (osName, net) {
  var dir = packageFile.name + '-' + osName + '-' + packageFile.version + '-' + net
  var fullpath = path.join(__dirname, 'build', dir)

  var result = []
  result.push(format('cd %s && mkdir -p public dapps tmp logs bin config', fullpath))
  result.push(format('cp -r package.json ddnd init .ddnrc.js %s', fullpath))
  if (net !== 'localnet') {
    if (osName === 'mac') {
      result.push(format('sed -i "" "s/testnet/%s/g" %s/ddnd', net, fullpath))
    } else {
      result.push(format('sed -i "s/testnet/%s/g" %s/ddnd', net, fullpath))
    }

    result.push(format('cp config/genesisBlock.json %s/config/', fullpath))
  } else {
    // result.push(format('cp config.json %s/', fullpath));
    result.push(format('cp config/genesisBlock.json %s/config/', fullpath))
    result.push(format('cp third_party/sqlite3.exe %s/', fullpath))
  }

  if (osName !== 'win') {
    result.push(format('cp `which node` %s/bin/', fullpath))
  }

  // result.push(format('cp -r public/dist %s/public/', fullpath));
  result.push(format('cd %s && npm install --production', fullpath))
  result.push(format('cd %s/.. && tar zcf %s.tar.gz %s', fullpath, dir, dir))

  return result
}

gulp.task('build-src-main', function (done) {
  buildSource('mainnet')
  done()
})

gulp.task('win64-build-local', function (done) {
  build('win64', 'localnet')
  done()
})

gulp.task('linux-build-local', function (done) {
  build('linux', 'localnet')
  done()
})

gulp.task('win64-build-test', function (done) {
  build('win64', 'testnet')
  done()
})

gulp.task('linux-build-test', function (done) {
  build('linux', 'testnet')
  done()
})

gulp.task('mac-build-test', function (done) {
  build('mac', 'testnet')
  done()
})

gulp.task('win64-build-main', function (done) {
  build('win64', 'mainnet')
  done()
})

gulp.task('linux-build-main', function (done) {
  build('linux', 'mainnet')
  done()
})
