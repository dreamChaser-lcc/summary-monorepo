# module-federation
模块联邦，webpack提供的模块共享方案，可以被用在微前端，将各个应用独立分开，能实现应用独立部署，独立开发。

官网demo: https://github.com/module-federation/module-federation-examples

react demo: https://github.com/module-federation/module-federation-examples/tree/master/advanced-api

缺点：
- 需要在webpack5+版本
- 没有做到沙箱（js,css样式隔离都需要别的手段）
- js隔离，自定义规范，避免重复命名导致应用共享出现问题
- css样式隔离，cssInJs方式，或者css-module，或者name-space方式（类似vue Scope生成的样式）

## 文件目录
module-federation            
├─ app1                                                               // 子应用app1
│  ├─ add-list.js            
│  ├─ bootstrap.js           
│  ├─ index.html             
│  ├─ index.js               
│  ├─ package.json           
│  └─ webpack.config.js      
├─ app2                                                               // 子应用app2           
│  ├─ bootstrap.js           
│  ├─ common-utils.js        
│  ├─ index.html             
│  ├─ index.js               
│  ├─ package.json           
│  └─ webpack.config.js      
├─ host-app                                                           // 主应用
│  ├─ bootstrap.js           
│  ├─ index.html             
│  ├─ index.js               
│  ├─ package.json           
│  └─ webpack.config.js      
├─ react-app                                                          // 暂时没有接入react应用中到主应用中          
│  ├─ public                 
│  │  ├─ favicon.ico         
│  │  ├─ index.html          
│  │  ├─ logo192.png         
│  │  ├─ logo512.png         
│  │  ├─ manifest.json       
│  │  └─ robots.txt          
│  ├─ src                    
│  │  ├─ App.css             
│  │  ├─ App.js              
│  │  ├─ App.test.js         
│  │  ├─ index.css           
│  │  ├─ index.js            
│  │  ├─ logo.svg            
│  │  ├─ reportWebVitals.js  
│  │  └─ setupTests.js       
│  ├─ package.json           
│  └─ README.md              
└─ README.md                 

## 运行

```bash
pnpm install 
# and 运行项目，app*因为package中的name都是以app开头的，所以pnpm可以这么批量运行
pnpm run --filter app* dev
```
### 访问路径
- host_app(主应用): localhost:9000
- app1: localhost:9001
- app2: localhost:9002

### 查看子应用暴露的js文件(检测模块联邦是否生效方法)
- app1: http://localhost:9001/app1_remoteEntry.js
- app2: http://localhost:9001/app2_remoteEntry.js

## 怎么实现
- 配置webpack.config.js文件
- ModuleFederationPlugin导入或暴露js
- 通过bootstrap.js动态导入，暴露的js(一定要是动态导入)

```js
// bootstrap.js host_app 主应用

// 引入app1子应用暴露出来的模块方法
import('app1_remote/addList').then(({addList}) => {
    addList();
});
// 引入app2子应用暴露出来的模块方法
import('app2_remote/commonUtils').then(({addContent}) => {
    addList();
});
```

```js
// webpack.config.js host_app 主应用
const { ModuleFederationPlugin } = require('webpack').container;
module.export ={
    plugins:[
       new ModuleFederationPlugin({
            name: 'app1',
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
}

```

```js
// webpack.config.js app1 子应用
const { ModuleFederationPlugin } = require('webpack').container;
module.export ={
     plugins:[
        new ModuleFederationPlugin({
            name: 'app1',
            filename: 'app1_remoteEntry.js',
            // 可以引用其他子应用暴露的方法
            remotes:{
                app2_remote: 'app2_remote@http://localhost:9002/app2_remoteEntry.js',
            },
            // 可以暴露方法
            exposes: {
                './addList': './add-list.js',
            },
            // 这里可以处理一些打包公共共享依赖
            // shared:{}
        })
    ],
}

```

```js
// webpack.config.js app2 子应用
const { ModuleFederationPlugin } = require('webpack').container;
module.export ={
    plugins:[
        new ModuleFederationPlugin({
            name: 'app2_remote',    // 要与entry.name相同
            filename: 'app2_remoteEntry.js', // 导出被其他应用remote的文件名称
            exposes: {
                // ./commonUtils：导出的路径（被其他应用引入），./common-utils.js：导出的文件在本项目的路径 
                './commonUtils': './common-utils.js',
            },
        })
    ],
}

```