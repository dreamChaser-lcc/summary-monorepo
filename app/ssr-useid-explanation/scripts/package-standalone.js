const fs = require('fs');
const path = require('path');

// 配置路径
const PROJECT_ROOT = path.resolve(__dirname, '..'); // 回到项目根目录
const DIST_DIR = path.join(PROJECT_ROOT, 'dist');
const NEXT_DIR = path.join(PROJECT_ROOT, '.next');
const STANDALONE_DIR = path.join(NEXT_DIR, 'standalone');
const STATIC_DIR = path.join(NEXT_DIR, 'static');
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public');

// 现代化的复制函数：使用 fs.cpSync (Node.js 16.7+)
// dereference: true 意味着如果遇到软链接，会复制链接指向的实际文件内容
// 这对 pnpm 尤其重要，因为我们想让 dist 目录完全脱离 pnpm store 独立运行
function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`⚠️ Warning: Source directory does not exist: ${src}`);
    return;
  }

  try {
    fs.cpSync(src, dest, { 
      recursive: true, 
      dereference: true, // 关键：解引用 Symlink，解决 pnpm EPERM 问题
      preserveTimestamps: true
    });
  } catch (err) {
    console.error(`❌ Error copying ${src} to ${dest}:`, err.message);
    // 抛出错误以便主流程捕获
    throw err;
  }
}

// 辅助函数：查找实际的 server.js 所在目录 (Monorepo 适配)
function findStandaloneRoot(baseDir) {
  if (fs.existsSync(path.join(baseDir, 'server.js'))) {
    return baseDir;
  }

  const queue = [baseDir];
  const maxDepth = 5; // 防止死循环
  let depth = 0;

  while (queue.length > 0 && depth < maxDepth) {
    const levelSize = queue.length;
    depth++;
    
    for (let i = 0; i < levelSize; i++) {
      const current = queue.shift();
      if (fs.existsSync(path.join(current, 'server.js'))) {
        return current;
      }
      
      try {
        const entries = fs.readdirSync(current, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory() && entry.name !== 'node_modules') {
            queue.push(path.join(current, entry.name));
          }
        }
      } catch (e) {}
    }
  }
  
  return null;
}

// 主逻辑
function main() {
  console.log('🚀 Starting standalone package preparation...');

  if (!fs.existsSync(STANDALONE_DIR)) {
    console.error(`❌ Error: ${STANDALONE_DIR} not found. Did you run "next build" with "output: standalone"?`);
    process.exit(1);
  }

  // 1. 清理旧的 dist 目录
  if (fs.existsSync(DIST_DIR)) {
    console.log('🧹 Cleaning up old dist directory...');
    // 使用 maxRetries 增加删除的稳定性（Windows 上文件锁问题）
    fs.rmSync(DIST_DIR, { recursive: true, force: true, maxRetries: 3, retryDelay: 500 });
  }
  fs.mkdirSync(DIST_DIR);

  // 2. 复制 standalone 内容
  console.log('📦 Copying standalone server files...');
  
  try {
    // 直接复制整个 standalone 目录
    // 这样做最简单，保留了所有内部结构，避免遗漏
    copyDir(STANDALONE_DIR, DIST_DIR);
  } catch (e) {
    console.error('Fatal error during copy. Aborting.');
    process.exit(1);
  }

  // 3. 处理入口脚本 (start.js)
  const appRootInStandalone = findStandaloneRoot(STANDALONE_DIR);
  
  if (appRootInStandalone) {
    const relativePath = path.relative(STANDALONE_DIR, appRootInStandalone);
    console.log(`   - Server root found at: ${relativePath}`);
    
    // 创建 start.js
    const entryPoint = path.join(relativePath, 'server.js');
    const entryContent = `
// Auto-generated entry script
process.chdir(__dirname); // 确保 CWD 正确
require('./${entryPoint.replace(/\\/g, '/')}');
`;
    fs.writeFileSync(path.join(DIST_DIR, 'start.js'), entryContent);
    console.log(`   - Created helper entry script: dist/start.js`);

    // 4. 补充静态资源
    // 确保 .next/static 和 public 既在根目录有，也在深层目录有
    console.log('🎨 Copying static assets...');
    
    const assets = [
      { src: STATIC_DIR, destName: '.next/static' },
      { src: PUBLIC_DIR, destName: 'public' }
    ];

    assets.forEach(({ src, destName }) => {
      // A. 复制到 dist 根目录 (标准位置)
      const rootDest = path.join(DIST_DIR, destName);
      if (!fs.existsSync(rootDest)) {
        // 如果 standalone 里没有包含（通常 .next/static 是不包含的），则复制
        // 如果已经存在（比如 standalone 复制过来时带了），则跳过或覆盖
        // 为安全起见，覆盖它
        copyDir(src, rootDest);
      }

      // B. 复制到 server.js 同级目录 (深层位置)
      const deepDest = path.join(DIST_DIR, relativePath, destName);
      // 避免自我复制 (如果 relativePath 是空字符串)
      if (path.resolve(deepDest) !== path.resolve(rootDest)) {
         copyDir(src, deepDest);
      }
    });

  } else {
    console.warn('⚠️ Could not find server.js automatically. You may need to run "node server.js" manually inside the correct directory.');
  }

  console.log('\n✅ Standalone package prepared successfully!');
  console.log(`📂 Output directory: ${DIST_DIR}`);
  console.log('👉 To start the server, run:');
  console.log('   cd dist');
  console.log('   node start.js');
}

main();
