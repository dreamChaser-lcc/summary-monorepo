const path = require('path');
const nodeExternals = require('webpack-node-externals');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const sharedModule = {
  rules: [
    {
      test: /\.(ts|tsx)$/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: [
            '@babel/preset-env',
            '@babel/preset-react',
            '@babel/preset-typescript'
          ]
        }
      },
      exclude: /node_modules/,
    },
  ],
};

const sharedResolve = {
  extensions: ['.tsx', '.ts', '.js'],
};

const serverConfig = {
  target: 'node',
  entry: './server/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'server.js',
    clean: true,
  },
  module: sharedModule,
  resolve: sharedResolve,
  externals: [nodeExternals()],
};

const clientConfig = {
  target: 'web',
  entry: './src/client.tsx',
  output: {
    path: path.resolve(__dirname, 'dist/public'),
    filename: 'client.[contenthash].js',
    publicPath: '/', // 确保资源路径为绝对路径
    clean: true,
  },
  module: sharedModule,
  resolve: sharedResolve,
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      filename: 'index.html',
      minify: false, // 禁用压缩，防止 React Hydration Mismatch
    }),
  ],
};

module.exports = { serverConfig, clientConfig };
