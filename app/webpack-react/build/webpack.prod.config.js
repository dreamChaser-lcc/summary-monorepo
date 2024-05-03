const { merge } = require('webpack-merge');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const baseConfig = require('./webpack.base.config');
const os = require('os');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { getCssLoaderConfig } = require("./loader.common.utils");

/**
 * 处理tsx|ts|js|jsx文件的编译方式
 * swc编译会比babel快很多,编译速度:swc > babel > babel+ts-loader
 * @param {{useSwc:boolean , useTsLoader:boolean}} params // useSwc是否使用swc, useTsLoader是否使用ts-loader
 * @returns 
 */
const transformCodeWay = (params)=>{
  const combinedValue = `${+params.useSwc}${+params.useTsLoader}`;
  switch(combinedValue){
    case '10':{ // 最快
      return [
        {
          test: /\.(tsx|ts|js|jsx)$/,
          exclude: /node_modules/,
          use: ['swc-loader'], // 添加babel仅兼容js，不做ts编译，编译交给ts-loader，也可以直接使用babel的ts相关预设插件
        },
      ]
    }
    case '00':{ // 较快, 但调试公共库不友好
      return [
        {
          test: /\.(tsx|ts|js|jsx)$/,
          exclude: /node_modules/,
          use: ['babel-loader'], // 需要开启@babel/preset-typescript, 并且，好像不支持直接引入monorepo公共库的.ts文件,要引入打包后的,否则编译会出问题！！！
        },
       
      ]
    }
    default:{ // 最慢, 调试公共库友好
      return [
        {
          test: /\.jsx|\.js$/,
          exclude: /node_modules/,
          use: 'babel-loader',
        },
        {
          test: /\.tsx|\.ts$/,
          exclude: /node_modules/,
          use: ['babel-loader','ts-loader'], // 添加babel仅兼容js，不做ts编译，编译交给ts-loader，也可以直接使用babel的ts相关预设插件，如00
        },
      ]
    }
  }
}

const prodConfig = {
  entry: {
    app: path.resolve(__dirname, '../src/index.tsx'),
  },
  module:{
    rules:[
      {
        oneOf:[
          {
            test: /\.(less|css)$/,
            exclude: /node_modules/,
            use: [
              MiniCssExtractPlugin.loader, 
              getCssLoaderConfig(),
              "postcss-loader",
              'less-loader'
            ],
          },
          ...transformCodeWay({ useSwc:true, useTsLoader:false }),
          // 代替webpack4的file-loader
          {
            test: /\.(png|jpe?g|gif|svg)$/i,
            type:'asset/resource',
            exclude: /node_modules/,
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
      }
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
        // react: {
        //   test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/, // 将react和react-dom分开打包
        //   name: 'react',  // 这个name需要配合webpack
        //   // filename: '[name]',
        //   priority: 0,
        //   chunks: 'all',
        //   reuseExistingChunk: true,
        // },
        defaultVendors: {
          test: /[\\/]node_modules[\\/]/,
          filename: 'js/[name].[contenthash:10].chunk.js',
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
      name: (entrypoint) => `runtime/runtimechunk~${entrypoint.name}`,
    },
  },
  // externalsType: 'script',
  performance: {  // 打包后体积过大提示
    hints: 'warning',
    maxEntrypointSize: 1024 * 1024, // 入口文件大于1MB提示
    maxAssetSize: 1024 * 1024,  // 打包后生成文件大于1MB提示
  },
  plugins:[
    new MiniCssExtractPlugin({
      filename: `css/[name].[contenthash:10].css`,
    }),
  ],
  // 如果需要调试，建议source-map，因为报错信息可以映射到指定行和列，但构建时间也会增加，如果不需要生成映射文件，可以设置为false，可以减少构建时间
  devtool: 'source-map',
  mode: 'production',
}

const handleExternalConfig = (useExternal)=>{
  const config = merge(baseConfig, prodConfig);

  if(useExternal){
    const externals =  {
      'react': 'React',
      "react-dom": 'ReactDOM',
    };
    config.externals = Object.assign({}, config.externals, externals);
    const externalsCdns = [
      "https://cdn.bootcdn.net/ajax/libs/react/18.2.0/umd/react.production.min.js",
      "https://cdn.bootcdn.net/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js",
    ];
    // 因为html-webpack-plugin是配置在数组第一个,所以plugins[0]
    config.plugins[0].options = Object.assign({}, config.plugins[0].options, { externalsCdns });
  }

  return config;
};

module.exports = handleExternalConfig(true);