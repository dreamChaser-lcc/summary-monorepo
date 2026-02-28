// 一个简单的 Loader，功能是：
// 1. 替换代码中的 "console.log" 为 "console.info"
// 2. 在每个文件头部注入一行版权注释
// 3. 打印当前处理的文件路径和 Loader 选项

module.exports = function(source) {
  // 1. 获取 Loader 的选项 (Options)
  // 在 Webpack 5 中，this.getOptions() 是内置的，不需要 loader-utils 了
  const options = this.getOptions();
  
  // 2. 获取当前处理的文件路径
  const filePath = this.resourcePath;
  
  console.log(`\n[MyCustomLoader] Processing: ${filePath}`);
  console.log(`[MyCustomLoader] Options:`, options);

  // 3. 核心逻辑：修改源码 (source)
  // 简单的字符串替换
  let newSource = source.replace(/console\.log/g, 'console.info');

  // 4. 根据选项注入版权信息
  if (options.author) {
    const banner = `/**\n * Author: ${options.author}\n * Date: ${new Date().toISOString()}\n */\n`;
    newSource = banner + newSource;
  }

  // 5. 返回转换后的代码
  // 方式一：直接 return (同步)
  return newSource;

  // 方式二：使用 this.callback (支持返回 source map 和 AST)
  // this.callback(null, newSource, sourceMap, meta);
  
  // 方式三：异步处理 (this.async)
  // const callback = this.async();
  // fs.readFile(..., (err, content) => {
  //   callback(err, content);
  // });
};
