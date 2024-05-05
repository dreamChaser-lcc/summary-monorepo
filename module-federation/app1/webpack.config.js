const { Configuration } = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;
const path = require('path');

/**
 * @type {Configuration}
 */
const config = {
    entry: {
        app1: path.resolve(__dirname,'./index.js'),
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
            name: 'app1',
            filename: 'app1_remoteEntry.js',
            remotes:{
                app2_remote: 'app2_remote@http://localhost:9002/app2_remoteEntry.js',
            },
            exposes: {
                './addList': './add-list.js',
            },
        })
    ],
    devServer: {
        compress: true,
        port: 9001,
        hot: true,
    },
    mode:'development',
}

module.exports = config;