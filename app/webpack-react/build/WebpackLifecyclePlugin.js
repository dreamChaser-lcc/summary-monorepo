// const chalk = require('chalk'); // 假设环境中有 chalk，如果没有可能需要降级处理，这里为了演示简单先不用 chalk 或者假设构建环境支持 ANSI 颜色
// 简单的颜色输出辅助函数
const red = (msg) => `\x1b[31m${msg}\x1b[0m`;
const green = (msg) => `\x1b[32m${msg}\x1b[0m`;
const yellow = (msg) => `\x1b[33m${msg}\x1b[0m`;
const blue = (msg) => `\x1b[34m${msg}\x1b[0m`;

class WebpackLifecyclePlugin {
  constructor(options) {
    this.options = options || {};
    this.startTime = 0;
  }

  apply(compiler) {
    // 1. 初始化阶段：compile
    // 这是一个同步钩子，compiler 开始编译时调用
    compiler.hooks.compile.tap('WebpackLifecyclePlugin', (params) => {
      this.startTime = Date.now();
      console.log('\n' + '━'.repeat(50));
      console.log(blue('🚀 [WebpackLifecyclePlugin] 构建开始 (compile hook)'));
      console.log('━'.repeat(50));
    });

    // 2. 构建阶段：compilation
    // 每当创建一个 compilation 对象时调用（可能在 watch 模式下多次触发）
    compiler.hooks.compilation.tap('WebpackLifecyclePlugin', (compilation) => {
      console.log(yellow('🔧 [WebpackLifecyclePlugin] 创建 compilation 对象 (compilation hook)'));
      
      // 监听 compilation 的钩子
      compilation.hooks.optimize.tap('WebpackLifecyclePlugin', () => {
        console.log(yellow('  ⚡ [WebpackLifecyclePlugin] 开始优化 (optimize hook)'));
      });
    });

    // 3. 生成阶段：emit
    // 这是一个异步钩子，在生成资源到 output 目录之前触发
    // 这里是修改最终文件的最后机会
    compiler.hooks.emit.tapAsync('WebpackLifecyclePlugin', (compilation, callback) => {
      console.log(green('📦 [WebpackLifecyclePlugin] 准备输出文件 (emit hook)'));
      
      // 打印一下即将输出的文件列表（只列出前5个）
      const assets = Object.keys(compilation.assets);
      console.log(`  📊 本次构建共生成 ${assets.length} 个文件`);
      assets.slice(0, 5).forEach(filename => {
        console.log(`    - ${filename}`);
      });
      if (assets.length > 5) console.log('    - ...');

      // 必须调用 callback 继续构建流程
      callback();
    });

    // 4. 完成阶段：done
    // 构建完成时调用
    compiler.hooks.done.tap('WebpackLifecyclePlugin', (stats) => {
      const endTime = Date.now();
      const timeCost = endTime - this.startTime;
      
      console.log('━'.repeat(50));
      console.log(blue(`✅ [WebpackLifecyclePlugin] 构建完成 (done hook)`));
      console.log(green(`⏱️  总耗时: ${timeCost}ms`));
      
      if (stats.hasErrors()) {
        console.log(red('❌ 构建包含错误！'));
      } else {
        console.log(green('✨ 构建成功！'));
      }
      console.log('━'.repeat(50) + '\n');
    });
  }
}

module.exports = WebpackLifecyclePlugin;
