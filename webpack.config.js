const webpack = require('webpack');
const path = require('path');

module.exports = {
  //页面入口文件配置
  entry: ['./test/request.js'],
  target: 'node',
  //入口文件输出配置
  output: {
    path: path.join(__dirname, 'test', 'build'),
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        // exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
            babelrc: false,
            presets: [
              [
                'env',
                {
                  targets: {
                    browsers: [
                      'Android >= 4',
                      'Chrome >= 35',
                      'Firefox >= 31',
                      'Explorer >= 9',
                      'iOS >= 7',
                      'Opera >= 12',
                      'Safari >= 7.1'
                    ],
                  },
                  modules: false,
                  useBuiltIns: false,
                  debug: false,
                },
              ],
              'stage-0',
              'react',
            ]
          }
        }
      }
    ],
  },
  //插件项
  plugins: [
    // new webpack.HotModuleReplacementPlugin(),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': '"development"',
      'process.env.BROWSER': false,
      'window': {
        appVersion: '"1.0.0"',
        deviceType: '""',
        cefc: {
          user: {
            clientId: 11,
            tpId: 1,
          },
          oac: {}
        },
        location: {
          href: '"/test"'
        }
      }
    }),
  ]
};
