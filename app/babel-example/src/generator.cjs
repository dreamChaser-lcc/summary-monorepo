const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse');
const generator = require('@babel/generator');
const t = require('@babel/types');
const NodePath = require('@babel/traverse').NodePath;


/**
 * lodash _.set更稳妥一点
 * 直接赋值 例如 _set(obj, 'a.b.c', 1) =》 obj.a.b.c = 1
 * @param {*} obj 
 * @param {*} path 
 * @param {*} value 
 * @returns 
 */
function _set(obj, path, value) {
  if (typeof path === 'string') {
    path = path.split('.');
  }

  let current = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (!current[key]) {
      current[key] = {};
    }
    current = current[key];
  }

  current[path[path.length - 1]] = value;
  return obj;
}

const struct = {
  container: {
    parentClass: '',
    name: 'container',
  },
  header: {
    parentClass: '',
    name: 'container',
  }
}
const getVisitor = function ({ types: t }) {
  const classTree = {};

  function addClassToTree(className, parentClass = null) {
    if (!classTree[className]) {
      classTree[className] = { children: {}, parent: parentClass };
    }
    if (parentClass) {
      if (!classTree[parentClass].children[className]) {
        classTree[parentClass].children[className] = { children: {}, parent: parentClass };
      }
    }
  }

  function myAddClassToTree(className, parentClass = null) {
    if (!classTree[className] && !parentClass) {
      classTree[className] = { key: className, parent: parentClass, trackLine: null };
      return
    }
    if (parentClass) {
      // console.log("🚀 ~ addClassToTree ~ classTree:", parentClass, classTree)
      if (parentClass) {
        const parentTrackLine = classTree[parentClass].trackLine;
        const trackLine = parentTrackLine ? `${classTree[parentClass].trackLine} ${className}`: `${classTree[parentClass].key} ${className}`; 
        classTree[className] = { key: className, parent: classTree[parentClass].key, trackLine };
      }
    }
  }

  /**
   * 获取jsx节点类名
   * @param { NodePath } path ast节点
   * @returns 
   */
  function getClassName(path) {
    const openingElement = path.openingElement;
    if (openingElement && t.isJSXIdentifier(openingElement.name)) {
      const classNameAttr = openingElement.attributes.find(attr =>
        t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name) && attr.name.name === 'className'
      );
      const rawClassStr = classNameAttr.value.value;
      return {
        rawClassStr,
        classList: rawClassStr ? rawClassStr.split(' ') : [],
      };
    }
    return null
  }

  return {
    visitor: {
      ClassDeclaration(path) {
        const className = path.node.id.name;
        addClassToTree(className);
      },
      ClassExpression(path) {
        if (path.node.id) {
          const className = path.node.id.name;
          addClassToTree(className);
        }
      },
      JSXElement(path) {
        const parentClass = getClassName(path.parent);
        const curClassName = getClassName(path.node);

        const parentTemp = parentClass ? parentClass.rawClassStr : null;
        curClassName.classList.forEach(className => {
          myAddClassToTree(className, parentTemp);
        });
      },
    },
    post() {
      function generateSCSS(tree, indent = 0) {
        let scssContent = '';
        for (const className in tree) {
          if (tree.hasOwnProperty(className)) {
            scssContent += ' '.repeat(indent) + `.${className} {\n`;
            scssContent += generateSCSS(tree[className].children, indent + 2);
            scssContent += ' '.repeat(indent) + `}\n`;
          }
        }
        return scssContent;
      }

      /**
       * 生成css空结构图
       */
      function myGenerateCSS(tree, indent = 0) {
        let scssContent = '';
        for (const [key, item] of Object.entries(tree)) {
          if (tree.hasOwnProperty(key)) {
            const name = item.trackLine ? item.trackLine.split(' ').join(' .') : item.key;
            scssContent += ' '.repeat(indent) + `.${name} {\n`;
            // scssContent += generateSCSS(tree[key].children, indent + 2);
            scssContent += ' '.repeat(indent) + `}\n`;
          }
        }
        return scssContent;
      }
      // const cssContent = myGenerateCSS(classTree);
      // console.log("🚀 ~ post ~ cssContent:\n", cssContent)

      const maxDeep = 3;
      /**
       * 生成scss空结构图
       */
      function myGenerateSCSS(tree, depth = 0, trackLine = null) {
        let scssContent = '';
        const newTree = {}
        if (JSON.stringify(tree) === '{}') {
          return ''
        }

        Object.entries(tree).forEach(([key, item]) => { 
          const isRoot = item.parent === null
          const nextTrackLine = isRoot ? item.key : item.trackLine;
          if (isRoot || item.trackLine && item.trackLine.includes(trackLine)) {
            delete tree[key];
            scssContent += ' '.repeat(depth)+`.${key} {\n`;
            scssContent += myGenerateSCSS(tree, depth+2, nextTrackLine);
            scssContent += ' '.repeat(depth) + `}\n`;
          }
        });
        return scssContent;
      }
      // const scssContent = myGenerateSCSS(classTree); 
      // console.log(scssContent)

      // console.log('🚀 ~ classTree', classTree)
      // console.log("🚀 ~ post ~ scssContent:", scssContent)
      // const scssFilePath = path.join(__dirname, 'output.scss');
      // fs.writeFileSync(scssFilePath, scssContent);
      // console.log(`Generated SCSS file at ${scssFilePath}`);
    },
  };
};

function writeFileIn(pathStr, content, useStringify=true) {
  const ast = useStringify ? JSON.stringify(content, null, 2) : content;
  const dir = path.dirname(pathStr);
  // 先创建文件夹再创建文件
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true }); // recursive: true 允许创建嵌套目录
  }
  fs.writeFile(pathStr, ast, (err) => {
    // console.log(err);
  });
}

function generateEmptySCC() {
  const sourceCode = `
    const render = ()=>{
      return (
      <>
        <div className="container">
          <div className="header h1">Header</div>
          <div className="content">
            <div className="sidebar">Sidebar</div>
            <div className="main">Main Content</div>
          </div>
          <div className="footer">Footer</div>
        </div>
        <div className="header h1">Header</div>
          <div className="content">
            <div className="sidebar">Sidebar</div>
            <div className="main">Main Content</div>
          </div>
          <div className="footer">Footer</div>
          </>
      )
    }
  `
  const ast = parser.parse(sourceCode, {
    sourceType: 'module',
    plugins: ['jsx'],
  });
  writeFileIn(path.join(__dirname, `/ast/ast-generator-jsx-${new Date().getTime()}.json`), ast)
  const config = getVisitor({ types: t })
  traverse.default(ast, {
    ...config.visitor,
  });
  config.post()
  // const result = generator.default(ast)
  // console.log(result.code)
}

generateEmptySCC()