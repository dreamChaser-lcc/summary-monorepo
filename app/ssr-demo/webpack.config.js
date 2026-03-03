const { merge } = require('webpack-merge');
const TerserPlugin = require('terser-webpack-plugin');
const { serverConfig, clientConfig } = require('./webpack.common.js');

const commonConfig = {
  mode: 'production',
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
      }),
    ],
  },
};

// 客户端特定的生产配置：移除 console.log
const clientProdConfig = {
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true, // 仅在客户端移除 console.log
          },
        },
        extractComments: false,
      }),
    ],
  },
};

// 服务端特定的生产配置：保留 console.log (用于日志记录)
const serverProdConfig = {
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: false, // 服务端保留 console.log
          },
        },
        extractComments: false,
      }),
    ],
  },
};

module.exports = [
  merge(serverConfig, commonConfig, serverProdConfig),
  merge(clientConfig, commonConfig, clientProdConfig),
];
