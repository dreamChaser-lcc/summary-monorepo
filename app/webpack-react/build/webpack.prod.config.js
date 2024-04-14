const { merge } = require('webpack-merge');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const baseConfig = require('./webpack.base.config');
const os = require('os');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const prodConfig = {
  entry: {
    app: path.resolve(__dirname, '../src/index.tsx'),
  },
  module:{
    rules:[
      {
        test: /\.less$/,
        exclude: /node_modules/,
        use: [MiniCssExtractPlugin.loader, 'css-loader', "postcss-loader", 'less-loader'],
      },
      {
        test: /\.css$/,
        exclude: /node_modules/,
        use: ['style-loader', 'css-loader', 'less-loader'],
      },
      {
        test: /\.jsx|\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
      {
        test: /\.tsx|\.ts$/,
        exclude: /node_modules/,
        use: 'ts-loader',
      },
      // 代替webpack4的file-loader
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type:'asset/resource',
        generator: {
          filename: 'static/[hash:10][ext][query]',// 单独定义输出路径和output.assetModuleFilename一样
        }
      },
      // 还可以将图片变成base64格式，嵌入内嵌标签src
      // {
      //   test: /\.png/,
      //   type: 'asset/inline'
      // },
    ]
  },
  optimization: {
    // chunkIds: 'named',
    splitChunks: {
      chunks: 'all',
      minSize: 0, 
      minRemainingSize: 0,
      minChunks: 1, // 引用次数1次以上就会被拆分
      maxAsyncRequests: 30,
      maxInitialRequests: 30,
      enforceSizeThreshold: 50000, // 大于50kb强行拆包
      // hidePathInfo:true,
      cacheGroups: {
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/, // 将react和react-dom分开打包
          name: 'react',  // 这个name需要配合webpack
          // filename: '[name]',
          priority: 0,
          chunks: 'all',
          reuseExistingChunk: true,
        },
        defaultVendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
          reuseExistingChunk: true,
        },
        default: {
          minChunks: 1,
          // minSize: 0,
          priority: -20,
          reuseExistingChunk: true,
        },
      },
    },
    minimizer: [
      // 在 webpack@5 中，你可以使用 `...` 语法来扩展现有的 minimizer（即 `terser-webpack-plugin`），将下一行取消注释
      // `...`,
      new CssMinimizerPlugin(),
      new TerserPlugin({
        parallel: os.cpus.length - 1, // 允许并发运行打包线程数量，可选值number|boolean，当true时,默认是 os.cpus().length - 1
        exclude: /\/node_modules/,
        extractComments: {  // 单独剥离注释文件，许可证开源信息等
          filename: (fileData) => {
            // The "fileData" argument contains object with "filename", "basename", "query" and "hash"
            return `${fileData.filename}.LICENSE.txt${fileData.query}`;
          },
        },
        terserOptions: {  // terserOption配置选项文档https://github.com/terser/terser?tab=readme-ov-file#format-options
          format: {
            comments: 'all', // 设置为true|false|'all'
          },
        }
      }),
    ],
    runtimeChunk: {
      name: (entrypoint) => `runtimechunk~${entrypoint.name}`,
    },
  },
  performance: {  // 打包后体积过大提示
    hints: 'warning',
    maxEntrypointSize: 1024 * 1024, // 入口文件大于1MB提示
    maxAssetSize: 1024 * 1024,  // 打包后生成文件大于1MB提示
  },
  plugins:[
    new MiniCssExtractPlugin({
      filename: `[name].[contenthash:10].css`,
    }),
  ],
  mode: 'production',
}

module.exports = merge(baseConfig, prodConfig);