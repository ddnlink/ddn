var path = require('path');
var nodeExternals = require('webpack-node-externals');
var webpack = require('webpack');
var _ = require('lodash');
var UglifyJsPlugin = require('uglifyjs-webpack-plugin');

// loaders配置
var getLoaders = function(env) {
  return [
    // ES6 -> ES5
    // {
    //   test: /\.es6\.js$/,
    //   exclude: /node_modules/,
    //   // include: path.resolve(__dirname, "./lib"),
    //   use: {
    //     loader: 'babel-loader',
    //     query: {
    //       presets: [
    //         ['env']
    //       ]
    //     }
    //   }
    // }

    // {
    //   test: /\.(proto)$/,
    //   use: [
    //     {
    //       loader: 'file-loader',
    //       options: {
    //         outputPath: '/'
    //       }
    //     }
    //   ]
    // }
  ];
};

// 插件配置
var getPlugins = function(env) {
  var plugins;

  var defaultPlugins = [];

  if (env === 'production') {
      // 线上模式的配置，去除依赖中重复的插件/压缩js/排除报错的插件
      plugins = _.union(defaultPlugins, [
        new webpack.ProvidePlugin({_require_native_: "_require_native_"}),
        new webpack.optimize.DedupePlugin(),
        new UglifyJsPlugin()

          // Todo: webpack自带的UglifyJsPlugin不起作用？
          // new webpack.optimize.UglifyJsPlugin()
      ]);
  } else {
      plugins = _.union(defaultPlugins, [
        new webpack.ProvidePlugin({_require_native_: "_require_native_"})
      ]);
  }

  return plugins;
};

module.exports = function(fullpath) {
  var env = process.env.NODE_ENV;

  return {
    entry: {
      app: './app.js'
    },
    output: {
      path: fullpath,
      filename: '[name].js'
    },
    context: __dirname,
    target: 'node',

    externals: [
        {
            _require_native_: "require"
        },
        nodeExternals()
    ],

    plugins: getPlugins(env),

    module: {
      rules: getLoaders(env)
    },

    node: {
      __dirname: false,
      __filename: false
    }
  }
}
