const { Configuration, DllPlugin } = require('webpack');
const path = require('path');

/**
 * @type {Configuration}
 */
const config = {
  mode: 'production',
  entry: {
    vendor: ['react', 'react-dom', 'react-router-dom'],
  },
  output: {
    filename: '[name].[contenthash:10].dll.js',
    path: path.resolve(__dirname, '../src/dll'),
    library: '[name]_[fullhash]',
    clean: true
  },
  plugins: [
    new DllPlugin({
      name: '[name]_[fullhash]',
      path: path.resolve(__dirname, '../src/dll/[name].manifest.json'),
      // context: path.resolve(__dirname, '../dll'),
      // entryOnly: true
    }),
  ],
}

module.exports = config;