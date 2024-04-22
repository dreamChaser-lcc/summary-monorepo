const path = require("path");
const { merge } = require("webpack-merge");
const baseConfig = require("./webpack.base.config");
const { getCssLoaderConfig } = require("./loader.common.utils");

const devConfig = {
  module: {
    rules: [
      {
        test: /\.(less|css)$/,
        exclude: /node_modules/,
        use: [
          "style-loader",
          getCssLoaderConfig(),
          "postcss-loader",
          "less-loader",
        ],
      },
      {
        test: /\.jsx|\.js$/,
        exclude: /node_modules/,
        use: "babel-loader",
      },
      {
        test: /\.tsx|\.ts$/,
        exclude: /node_modules/,
        use: "ts-loader",
      },
      // 代替webpack4的file-loader
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: "asset/resource",
        generator: {
          filename: "static/[hash][ext][query]", // 单独定义输出路径和output.assetModuleFilename一样
        },
      },
      // 还可以将图片变成base64格式，嵌入内嵌标签src
      // {
      //   test: /\.png/,
      //   type: 'asset/inline'
      // },
    ],
  },
  optimization: {
    minimize: true,
  },
  devServer: {
    static: {
      directory: path.join(__dirname, "public"),
    },
    client: {
      overlay: false, // 隐藏错误遮盖提示
    },
    compress: true,
    hot: true, // webpack5+默认内置，其他版本需要HotModuleReplacementPlugin
    port: 9000,
  },
  // 推荐 cheap-module-source-map 或 cheap-source-map,可以将错误信息映射到对应行,如果需要更快则设置eval-cheap-module-source-map
  devtool: "cheap-module-source-map",
  mode: "development",
};

module.exports = merge(baseConfig, devConfig);