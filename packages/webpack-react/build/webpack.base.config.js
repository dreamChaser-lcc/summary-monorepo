const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    home: path.resolve(__dirname, '../src/index.js'),
  },
  output:{
    path: path.resolve(__dirname, '../dist'),
    filename: '[name].[contenthash].chunk.js',
    assetModuleFilename: 'images/[hash:10][ext][query]', // 资源文件的输出路径
    sourceMapFilename: '[file].[chunkhash:10].map[query]', // sourceMap路径
    clean:true,
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'], // 配置文件后缀名,在引入时可以省略掉
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
  },
  plugins:[
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, '../src/index.html')
    })
  ],
}