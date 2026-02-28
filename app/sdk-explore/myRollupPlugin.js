// 一个简单的 Rollup 插件
// 功能：
// 1. 拦截 import 语句
// 2. 在每个文件头部注入 Banner
// 3. 在构建结束时打印文件大小

import path from 'path';

export default function myRollupPlugin(options = {}) {
  return {
    name: 'my-rollup-plugin',

    // 1. resolveId: 拦截 import 语句（类似 Webpack 的 resolve）
    // 当你写 import 'virtual-module' 时，Rollup 会先问插件：你知道这个 ID 怎么处理吗？
    resolveId(source) {
      if (source === 'virtual-module') {
        // 告诉 Rollup：这个模块我接管了，它的绝对路径是这个
        return source; 
      }
      return null; // 其他模块我不处理，交给下一个插件
    },

    // 2. load: 加载文件内容（类似 Webpack 的 Loader）
    // 只有当 resolveId 返回了 id，且 Rollup 尝试加载它时，才会触发 load
    load(id) {
      if (id === 'virtual-module') {
        // 直接返回代码内容
        return 'export default "This is from virtual module!"';
      }
      return null; // 其他文件走默认加载逻辑（读取磁盘）
    },

    // 3. transform: 转换代码（最像 Webpack Loader 的地方）
    transform(code, id) {
      // 只处理 .ts 文件
      if (!id.endsWith('.ts')) return null;

      console.log(`[MyRollupPlugin] Transforming: ${id}`);
      
      // 简单替换：把 console.log 换成 console.warn
      // 注意：这里返回的必须是 JS 代码，或者是能被下一个插件处理的代码
      return {
        code: code.replace(/console\.log/g, 'console.warn'),
        map: null // 如果有 source map，这里要返回
      };
    },

    // 4. renderChunk: 在生成 chunk 时触发（类似 Webpack 的 emit）
    // 可以在这里给文件加 Banner
    renderChunk(code) {
      const banner = `/**\n * Author: ${options.author || 'Unknown'}\n * Date: ${new Date().toISOString()}\n */\n`;
      return banner + code;
    },

    // 5. generateBundle: 构建完成前触发（类似 Webpack 的 emit）
    generateBundle(options, bundle) {
      console.log('\n[MyRollupPlugin] Generated files:');
      for (const fileName in bundle) {
        const file = bundle[fileName];
        console.log(` - ${fileName} (${file.code.length} bytes)`);
      }
    }
  };
}
