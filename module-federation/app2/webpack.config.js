const { Configuration } = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;
const path = require('path');

/**
 * @type {Configuration}
 */
const config = {
    entry: {
        app2_remote: path.resolve(__dirname,'./index.js'),
    },
    output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    },
    module: {
        rules:[
            {
                test:'/\.js$/',
                exclude: /node_modules/,
                use: 'babel-loader',
            },
            {
                test:'/\.css$/',
                exclude: /node_modules/,
                use: ['style-loader', 'css-loader']
            }
        ]
    },
    plugins:[
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname,'./index.html'),
        }),
        new ModuleFederationPlugin({
            name: 'app2_remote',    // 要与entry.name相同
            filename: 'app2_remoteEntry.js', // 导出被其他应用remote的文件名称
            exposes: {
              // ./commonUtils：导出的路径（被其他应用引入），./common-utils.js：导出的文件在本项目的路径 
              './commonUtils': './common-utils.js',
            },
        })
    ],
    devServer: {
        compress: true,
        port: 9002,
        hot: true,
    },
    mode:'development',
}

module.exports = config;