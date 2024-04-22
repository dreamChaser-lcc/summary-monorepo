/**
 * css-loader公共配置
 * @param {*} options 
 * @returns 
 */
function getCssLoaderConfig(options) {
  return {
    loader: "css-loader",
    options: {
      modules: { // 工程化cssModule
        localIdentName: '[local]-[hash:base64:5]',  // css类名的定义规则
        // auto: (resourcePath, resourceQuery, resourceFragment) => {
        //   console.log('outer resourcePath',resourcePath)
        //   return resourcePath.endsWith(".module.css") ||  resourcePath.endsWith(".module.less");
        // },
        mode: (resourcePath, resourceQuery, resourceFragment) => {
          /**
           * cssModule.mode
           * local：默认模式，生成的类名是局部作用域的，不会影响其他组件。
           * global：生成的类名是全局作用域的，可以在全局范围内使用，不会被模块化。
           * pure：类似于local模式，但不支持composes语法，可以提供更纯净的局部作用域。
           * icss：支持import语法，可以用于在不同的CSS文件之间共享类名。
           */
          if (/\.module\.(less|css)$/i.test(resourcePath)) {
            console.log('cssModule resourcePath', resourcePath)
            return "local";
          }
          return "global";
        },
      },
      ...options
    },
  }
}

module.exports = {
  getCssLoaderConfig
} 