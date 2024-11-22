import { parse } from '@vue/compiler-sfc';
import { parse as babelParse } from '@babel/parser';
import traverse from "@babel/traverse";
import { writeFile } from 'fs';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const code = `
<template>
  <p>我是一个段落</p>
</template>
<script>
export default {
  data(){
    return {
      variable: 1
    }
  }
}
</script>
<style lang="scss">
.container{
  background: red;
}
</style>
`;

/**
 * 解析.vue文件
 */
function parseVue() {
  const { descriptor } = parse(code);
  // console.log(descriptor); // 这里是解析vue文件之后的一些内容
  if (descriptor.script) {
    const ast = babelParse(descriptor.script.content, {
      sourceType: 'module', // 对于 ES 模块
      plugins: ['jsx', 'typescript'], // 根据需要添加插件
    });
    const filePath = join(__dirname, `/ast/ast-vue-${new Date().getTime()}.json`);
    const dir = dirname(filePath);
    // 先创建文件夹再创建文件
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true }); // recursive: true 允许创建嵌套目录
    }
    writeFile(filePath, JSON.stringify(ast), (err) => {
      console.log(err);
    });
  }
}

// parseVue();

const jsCode = `
  if(Debug){
    console.log('hello world');
  }
`
/**
 * 解析js文件
 */
function parseJs() {
  const ast = babelParse(jsCode, {
    sourceType: 'module', // 对于 ES 模块
    plugins: ['jsx', 'typescript'], // 根据需要添加插件
  });
  const filePath = join(__dirname, `/ast/ast-js-${new Date().getTime()}.json`);
  const dir = dirname(filePath);
  // 先创建文件夹再创建文件
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true }); // recursive: true 允许创建嵌套目录
  }
  writeFile(filePath, JSON.stringify(ast), (err) => {
    console.log(err);
  });
}
parseJs()

// function jsTraverse(t) {
//   const visitor = {
//     ExpressionStatement(path) {
//       console.log('ExpressionStatement');
//     },
//     CallExpression(path) {
//       console.log('CallExpression');
//     },
//     BlockStatement(path) {
//       console.log("应该进不来这里BlockStatement:")
//     },
//   }
//   const ast = babelParse(jsCode, {
//     sourceType: 'module', // 对于 ES 模块
//     plugins: ['jsx', 'typescript'], // 根据需要添加插件
//   });
//   // console.log("🚀 ~ jsTraverse ~ traverse:", traverse)
//   traverse.default(ast, visitor);
// }
// jsTraverse()