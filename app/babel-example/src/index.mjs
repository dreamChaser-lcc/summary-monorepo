import { parse } from '@vue/compiler-sfc';
import { parse as babelParse } from '@babel/parser';
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

function parseVue() {
  // 解析.vue文件
  const { descriptor } = parse(code);
  // console.log(descriptor); // 这里是解析vue文件之后的一些内容
  if (descriptor.script) {
    console.log('🚀 ~ parseVue ~ descriptor.script:', descriptor.script);
    const ast = babelParse(descriptor.script.content, {
      sourceType: 'module', // 对于 ES 模块
      plugins: ['jsx', 'typescript'], // 根据需要添加插件
    });
    console.log('🚀 ~ parseVue ~ ast:', JSON.stringify(ast));
    const filePath = join(__dirname, `/ast/ast-${new Date().getTime()}.json`);
    const dir = dirname(filePath);
    console.log('🚀 ~ parseVue ~ filePath:', filePath, __dirname);
    if (!fs.existsSync(dir)) {
      console.log('🚀 ~ parseVue ~ dir:', dir);
      fs.mkdirSync(dir, { recursive: true }); // recursive: true 允许创建嵌套目录
    }
    writeFile(filePath, JSON.stringify(ast), (err) => {
      console.log(err);
    });
  }
}

parseVue();
