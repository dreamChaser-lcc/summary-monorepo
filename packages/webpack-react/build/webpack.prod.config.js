const { merge } = require('webpack-merge');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const baseConfig = require('./webpack.base.config');

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
    minimizer: [
      // 在 webpack@5 中，你可以使用 `...` 语法来扩展现有的 minimizer（即 `terser-webpack-plugin`），将下一行取消注释
      // `...`,
      new CssMinimizerPlugin(),
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