const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    home: path.resolve(__dirname, '../src/index.js'),
  },
  output:{
    path: path.resolve(__dirname, '../dist'),
    filename: '[name].[contenthash].chunk.js',
    assetModuleFilename: 'images/[hash][ext][query]', // 资源文件的输出路径
    clean:true,
  },
  module:{
    rules:[
      {
        test: /\.less$/,
        exclude: /node_modules/,
        use: ['style-loader', 'css-loader', "postcss-loader", 'less-loader'],
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
          filename: 'static/[hash][ext][query]',// 单独定义输出路径和output.assetModuleFilename一样
        }
      },
      // 还可以将图片变成base64格式，嵌入内嵌标签src
      // {
      //   test: /\.png/,
      //   type: 'asset/inline'
      // },
    ]
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
  mode: 'development',
}