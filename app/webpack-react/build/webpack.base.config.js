const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    app: path.resolve(__dirname, '../src/index.tsx'),
  },
  output:{
    path: path.resolve(__dirname, '../dist'),
    filename: '[name].[contenthash].bundle.js',
    chunkFilename: 'js/[name].chunk.js',  // chunkFilename选项只适用于异步按需加载的chunk拆分
    assetModuleFilename: 'images/[hash:10][ext][query]', // 资源文件的输出路径
    sourceMapFilename: '[file].[chunkhash:10].map[query]', // sourceMap路径
    clean:true,
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'], // 配置文件后缀名,在引入时可以省略掉
    extensionAlias: {
      '.js': ['.ts', '.js'],
      '.tsx': ['.tsx', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    },
    modules: [  // 导入寻找模块的顺序，优先找src目录下的包，再去node_modules寻找
      path.resolve(__dirname, 'src'),
      'node_modules'
    ],
    // mainFiles 在导入第三模块时，检索入口文件的字段，
    // 如:import React from 'react'，会优先查询react中的package.json中的browser字段,是否定义，如果定义，就以定义的为入口路径解析模块
    // 依次查询顺序 browser > module > main,那么如果确定main字段定义的是入口文件，可以仅设置为['main'],可以减少检索构建时间
    mainFields: ['browser', 'module', 'main'],
    alias: {
      "@": path.resolve(__dirname, '../src'),
    },
  },
  devServer: {
    // static: {
    //   directory: path.join(__dirname, 'public'),
    // },
    client: {
      overlay: false, // 隐藏错误遮盖提示
    },
    compress: true,
    hot: true, // webpack5+默认内置，其他版本需要HotModuleReplacementPlugin
    port: 9000,
    historyApiFallback: true, //history路由模式，找不到资源文件会重定向到程序入口文件app.js,部署需要用nginx重定向
  },
  plugins:[
    new HtmlWebpackPlugin({
      title: 'webpack-react',
      template: path.resolve(__dirname, '../src/index.html'),
      favicon: path.resolve(__dirname, '../public/favicon.ico'),
    })
  ],
}