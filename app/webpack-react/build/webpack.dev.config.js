const path = require("path");
const { merge } = require("webpack-merge");
const baseConfig = require("./webpack.base.config");
const { getCssLoaderConfig } = require("./loader.common.utils");
const { DllReferencePlugin } = require("webpack");
// const AddAssetHtmlPlugin = require('add-asset-html-webpack-plugin'); // 这个插件影响打包速度，还是不用了
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WebpackLifecyclePlugin = require('./WebpackLifecyclePlugin');

const fs = require('fs');

// 获取DLL文件名的函数
function getDllFilePath() {
  const dllDirectory = path.resolve(__dirname, '../dll'); // DLL文件所在的目录
  const files = fs.readdirSync(dllDirectory); // 读取目录中的文件

  // 过滤出以.dll.js的DLL文件
  const dllFileName = files.find(file => file.endsWith('.dll.js'));
  console.log("🚀 ~ getDllFilePath ~ path.join(__dirname, dllFileName):", path.join(__dirname, dllFileName))
  return path.resolve(__dirname,'../dll', dllFileName);
}

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
        use: [
          {
            loader: "ts-loader",
            options: {
              // 会关闭构建过程类型检查
              transpileOnly: true,
            },
          },
          // 注入自定义 Loader
          {
            loader: path.resolve(__dirname, './MyCustomLoader.js'),
            options: {
              author: 'LCC', // 传递给 loader 的参数
            }
          }
        ],
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
    static: [
      {
        directory: path.resolve(__dirname, 'public'),
      },
      {
        directory: path.resolve(__dirname, '../dll'),
      },
    ],
    client: {
      overlay: false, // 隐藏错误遮盖提示
    },
    compress: true,
    hot: true, // webpack5+默认内置，其他版本需要HotModuleReplacementPlugin
    port: 9000,
  },
  plugins:[
    new WebpackLifecyclePlugin(),
    new DllReferencePlugin({
      // context: __dirname,
			manifest: path.resolve(__dirname, '../dll/vendor.manifest.json'),
      // extensions: [".js", ".jsx"],
		}),
  ],
  // 推荐 cheap-module-source-map 或 cheap-source-map,可以将错误信息映射到对应行,如果需要更快则设置eval-cheap-module-source-map
  devtool: "cheap-module-source-map",
  mode: "development",
};

const handleExternalConfig = (useExternal)=>{
  const config = merge(baseConfig, devConfig);

  if(useExternal){
    const externalsCdns = [ // 懒得写别的属性了，复用生产环境注入html的cdn链接的结构
      "vendor.2768f7cf7e.dll.js",
    ];
    // 因为html-webpack-plugin是配置在数组第一个,所以plugins[0]
    config.plugins[0].options = Object.assign({}, config.plugins[0].options, { externalsCdns });
  }
  return config;
};

module.exports = handleExternalConfig(true);