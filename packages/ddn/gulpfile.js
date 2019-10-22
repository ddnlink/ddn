var path = require('path');
var util = require('util');
var moment = require('moment');
var gulp = require('gulp');
var shell = require('gulp-shell');
var replace = require('gulp-replace');
var webpack = require('webpack');
var nodeExternals = require('webpack-node-externals');
var package = require('./package');
// var UglifyJsPlugin = require('uglifyjs-webpack-plugin')

var format = util.format;
var buildTime = moment().format('HH:mm:ss DD/MM/YYYY');

function build(osName, netVersion, projectName) {
  var dir = 'ddn-' + osName + '-' + package.version + '-' + netVersion;
  var fullpath = path.join(__dirname, 'build', dir);

  return webpack(require('./webpack.config.js')(fullpath), function(){
    gulp.src(path.join(fullpath, 'app.js'))
    .pipe(replace('localnet', netVersion))
    .pipe(replace('development', buildTime))
    .pipe(gulp.dest(fullpath))
    .pipe(shell(getCmds(osName, netVersion, projectName)));
  })
}

function buildSource(netVersion) {
  var dir = 'ddn-' + 'linux' + '-' + package.version + '-' + netVersion;
  var fullpath = path.join(__dirname, 'build', dir);

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
    .pipe(replace('localnet', netVersion))
    .pipe(replace('development', buildTime))
    .pipe(gulp.dest(fullpath));
}

function getCmds(osName, netVersion, projectName) {
  var dir = 'ddn-' + osName + '-' + package.version + '-' + netVersion;
  var fullpath = path.join(__dirname, 'build', dir);

  var result = [];
  result.push(format('cd %s && mkdir -p public dapps tmp logs bin', fullpath));
  result.push(format('cp -r package.json ddnd init protos %s', fullpath));
  if (netVersion != 'localnet') {
    if (osName == 'mac') {
      result.push(format('sed -i "" "s/testnet/%s/g" %s/ddnd', netVersion, fullpath));
    } else {
      result.push(format('sed -i "s/testnet/%s/g" %s/ddnd', netVersion, fullpath));
    }

    result.push(format('cp configs/%s/%s.json %s/config.json', projectName, netVersion, fullpath));
    result.push(format('cp genesisBlocks/%s/%s.json %s/genesisBlock.json', projectName, netVersion, fullpath));

    result.push(format('cp config.database.js %s/config.database.js', fullpath));
    result.push(format('cp config.asset.js %s/config.asset.js', fullpath));

    result.push(format('cp -r ./src/db/sequelize/models/ %s/', fullpath));
    result.push(format('cp -r ./src/schema/format-ext/ %s/', fullpath));
    result.push(format('cp -r ./src/schema/ddn-schemas/ %s/', fullpath));
    result.push(format('cp -r ./src/network/service/ %s/', fullpath));
  } else {
    result.push(format('cp config.json %s/', fullpath));
    result.push(format('cp genesisBlock.json %s/', fullpath));
    result.push(format('cp third_party/sqlite3.exe %s/', fullpath));
  }

  if (osName !== 'win') {
    result.push(format('cp `which node` %s/bin/', fullpath));
  }

  // result.push(format('cp -r public/dist %s/public/', fullpath));
  result.push(format('cd %s && npm install --production', fullpath));
  result.push(format('cd %s/.. && tar zcf %s.tar.gz %s', fullpath, dir, dir));

  return result
}

const projectName = 'DDN';

gulp.task('build-src-main', function (done) {
  buildSource('mainnet');
  done();
})

gulp.task('win64-build-local', function (done) {
  build('win64', 'localnet', projectName);
  done();
});

gulp.task('linux-build-local', function (done) {
  build('linux', 'localnet', projectName);
  done();
});

gulp.task('win64-build-test', function (done) {
  build('win64', 'testnet', projectName);
  done();
});

gulp.task('linux-build-test', function (done) {
  build('linux', 'testnet', projectName);
  done();
});

gulp.task('mac-build-test', function (done) {
  build('mac', 'testnet', projectName);
  done();
});

gulp.task('win64-build-main', function (done) {
  build('win64', 'mainnet', projectName);
  done();
});

gulp.task('linux-build-main', function (done) {
  build('linux', 'mainnet', projectName);
  done();
});
