const { Configuration } = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;
const path = require('path');

/**
 * @type {Configuration}
 */
const config = {
    entry: {
        host_app: path.resolve(__dirname,'./index.js'),
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
            name: 'host_app',
            // filename: 'remoteEntry.js',
            // 配置连接的子应用
            remotes: {
                /**
                 *  app1_remote（可以自定义，bootstrap.js连接的时候要对应使用）
                 *  引入链接格式：remote(引用名称)+@+远程应用运行地址+/app2_remoteEntry.js(远程应用暴露出来文件名称)
                 *  示例 remote@http://localhost:9001/app2_remoteEntry.js
                 */
                app1_remote: 'app1@http://localhost:9001/app1_remoteEntry.js',
                app2_remote: 'app2_remote@http://localhost:9002/app2_remoteEntry.js',
            },
        })
    ],
    devServer: {
        compress: true,
        port: 9000,
        hot: true,
    },
    mode:'development',
}

module.exports = config;