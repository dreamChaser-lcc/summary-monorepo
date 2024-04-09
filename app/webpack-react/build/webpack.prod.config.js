const { merge } = require('webpack-merge');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const baseConfig = require('./webpack.base.config');
const os = require('os');

const prodConfig = {
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
    // splitChunks: {
    //   chunks: 'all',
    // },
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
  },
  plugins:[
    new MiniCssExtractPlugin({
      filename: `[name].[contenthash:10].css`,
    }),
  ],
  mode: 'production',
}

module.exports = merge(baseConfig, prodConfig);