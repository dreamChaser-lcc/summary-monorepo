import { parse } from '@vue/compiler-sfc';
import { parse as parse2vue } from '@vue/compiler-dom';
import { parse as babelParse } from '@babel/parser';
import traverse from "@babel/traverse";
import generator from '@babel/generator';
import t from '@babel/types';
import { writeFile } from 'fs';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ----------------------------------------解析vue script内容-------------------------------
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

// ----------------------------------------解析js内容-----------------------------------
const jsCode = `
  if(Debug){
    console.log('hello world');
  }
`
function writeFileIn(path, content, useStringify=true) {
  const ast = useStringify ? JSON.stringify(content, null, 2) : content;
  const dir = dirname(path);
  // 先创建文件夹再创建文件
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true }); // recursive: true 允许创建嵌套目录
  }
  writeFile(path, ast, (err) => {
    console.log(err);
  });
}
/**
 * 解析js文件
 */
function parseJs() {
  const ast = babelParse(jsCode, {
    sourceType: 'module', // 对于 ES 模块
    plugins: ['jsx', 'typescript'], // 根据需要添加插件
  });
  const filePath = join(__dirname, `/ast/ast-js-${new Date().getTime()}.json`);
  writeFileIn(filePath, JSON.stringify(ast))
}
// parseJs()

/**
 * 
 * @param {} t 
 */
function jsTraverse(t) {
  const visitor = {
    ExpressionStatement(path) {
      console.log('ExpressionStatement');
    },
    CallExpression(path) {
      console.log('CallExpression');
    },
    BlockStatement(path) {
      console.log("应该进不来这里BlockStatement:")
    },
  }
  const ast = babelParse(jsCode, {
    sourceType: 'module', // 对于 ES 模块
    plugins: ['jsx', 'typescript'], // 根据需要添加插件
  });
  // console.log("🚀 ~ jsTraverse ~ traverse:", traverse)
  traverse.default(ast, visitor);
}
// jsTraverse()

// ----------------------------------------解析vueTemlate内容------------------------------
function vueTraverse(node) {
  console.log(`Node type: ${node.type}, Tag: ${node.tag || ''}`);

  if (node.children && Array.isArray(node.children)) {
    node.children.forEach(child => vueTraverse(child));
  }
}

function parseTemplate() {

  // 示例模板字符串
  const template = `
    <div>
      <h1 class="hh">Hello, {{ name }}!</h1>
      <p v-if="show">This is a paragraph.</p>
    </div>
  `;

  // 解析模板为 AST
  const ast = parse2vue(template);
  console.log("🚀 ~ parseTemplate ~ ast:", ast)
  const filePath = join(__dirname, `/ast/ast-vue-template-${new Date().getTime()}.json`);
  writeFileIn(filePath, JSON.stringify(ast))
  // vueTraverse(ast);
  // console.log(JSON.stringify(ast, null, 2));
  // traverse.default(ast, {
  //   1(path) {
  //     console.log("🚀 ~ 1 ~ path:", path)
  //   }
  // });
}

// parseTemplate()

// ----------------------------------------解析jsx内容------------------------------
function parseJsx() {

  // 示例模板字符串
  const JSXEle = `
    // const Fc = () => {
      // return (
        <div>
          <h1 class="name1">Hello, {{ name }}!</h1>
          <p class="name2">This is a paragraph.</p>
        </div>
    //   )
    // };
  `;
  const JSXEle1 = `
    <div>
      <h1 class="name1">Hello, { name }!</h1>
      <p class="name2">This is a paragraph.</p>
    </div>
  `;

  // 解析模板为 AST
  const ast = babelParse(JSXEle1, {
    plugins: ['jsx'], // 根据需要添加插件
  });
  // console.log("🚀 ~ parseTemplate ~ ast:", ast)
  const filePath = join(__dirname, `/ast/ast-jsx-${new Date().getTime()}.json`);
  // writeFileIn(filePath, ast)
  // console.log(JSON.stringify(ast, null, 2));
  traverse.default(ast, {
    JSXAttribute(path) {
       // 创建一个调用表达式
      const callExpression = t.callExpression(
        t.identifier('console.log'),
        [t.stringLiteral('Hello, world!')]
      );
      // 在函数声明前插入调用表达式
      path.insertBefore(t.expressionStatement(callExpression));
      console.log("🚀 ~ 1 ~ JSXAttribute:", path.value)
    }
  });
  writeFileIn(filePath, ast)
  const { code: generatedCode } = generator.default(ast, {
    compact: false, // 生成格式化的代码
    comments: true  // 保留注释
  });
  console.log("🚀 ~ generatedCode ~ generatedCode:", generatedCode)
}

parseJsx()