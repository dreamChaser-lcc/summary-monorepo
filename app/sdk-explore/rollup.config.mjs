import externals from 'rollup-plugin-node-externals'
import dts from 'rollup-plugin-dts'
import esbuild, { minify } from 'rollup-plugin-esbuild'
import typescript from '@rollup/plugin-typescript'
import myRollupPlugin from './myRollupPlugin.js'

// 从命令行参数获取配置
const args = process.argv.slice(2)
const getArgValue = (argName, defaultValue) => {
  const argIndex = args.findIndex(arg => arg.startsWith(`--${argName}`))
  if (argIndex === -1) return defaultValue
  
  const arg = args[argIndex]
  if (arg.includes('=')) {
    return arg.split('=')[1] === 'true'
  }
  // 如果没有等号，检查下一个参数
  const nextArg = args[argIndex + 1]
  return nextArg === 'true'
}

const useConst = getArgValue('use-const', true) // true => 使用const变量, false 会默认使用var,使用esbuild构建这个配置不会生效，要更改esbuild的构建配置
const useEsbuild = getArgValue('use-esbuild', true) // true =>使用esbuild,false => typescript打包
const useThrowOnError = getArgValue('throw-on-error', true) // 有 TypeScript 错误时，停止构建 🛑
const usePreserveModules = getArgValue('preserve-modules', true) // true 构建结果保留文件目录, false=>只输出一个文件，适用于cdn

// 打印当前配置
console.log('🔧 构建配置:')
console.log(`   useEsbuild: ${useEsbuild}`)
console.log(`   useConst: ${useConst}`)
console.log(`   useThrowOnError: ${useThrowOnError}`)
console.log(`   usePreserveModules: ${usePreserveModules}`)
console.log('')

/**
 * @type {import('rollup').RollupOptions}
 */
const config = [
  /**
   * d.ts文件 
   * dts插件把所有类型打包到同一个文件中工具库使用便于ts提示和检查
   * （要走在package.json中type声明文件的路径）
   */
  {
    input: 'index.ts',
    output: {
      file: 'dist/sdk.d.ts',
    },
    // external: ['axios'], // 明确指定 axios 为外部依赖 externals()也会剔除的
    plugins: [
      externals(),
      dts()
    ]
  },
  /** commonjs */
  {
    input: 'index.ts',
    output: {
      dir: 'dist/cjs',
      format: 'cjs',
      preserveModules: usePreserveModules,
      entryFileNames: '[name].cjs',
      generatedCode: {
        constBindings: useConst
      }
    },
    // external: ['axios'], // 明确指定 axios 为外部依赖 externals()也会剔除的
    plugins: [
      myRollupPlugin({ author: 'LCC' }),
      externals(),  
      useEsbuild ? esbuild() : typescript(
        {
          noEmitOnError: useThrowOnError,
          outDir: 'dist/cjs',
          removeComments: true
        }
      )
    ]
  },
  /** esm */
  {
    input: 'index.ts',
    output: {
      dir: 'dist/es',
      format: 'es',
      // 保留模块目录 false则只是输出一个文件
      preserveModules: true,
      entryFileNames: '[name].mjs',
      generatedCode: {
        constBindings: useConst
      }
    },
    // external: ['axios'], // 明确指定 axios 为外部依赖 externals()也会剔除的
    plugins: [
      externals(),
      useEsbuild ? esbuild() : typescript(
        {
          noEmitOnError: useThrowOnError,
          outDir: 'dist/es',
          removeComments: true
        }
      )
    ]
  },
  /** cdn */
  {
    input: 'index.ts',
    output: [
      // iife模块化，适用于ie浏览器
      {
        dir: 'cdn',
        format: 'iife',
        // 保留模块目录 false则只是输出一个文件
        preserveModules: false,
        entryFileNames: '[name].js',
        name: 'sdkName',
        generatedCode: {
          constBindings: useConst
        }
      },
      // iife模块化，适用于ie浏览器，添加压缩
      {
        dir: 'cdn',
        format: 'iife',
        // 保留模块目录 false则只是输出一个文件
        preserveModules: false,
        entryFileNames: '[name].min.js',
        name: 'sdkName',
        generatedCode: {
          constBindings: useConst
        },
        plugins: [minify()]
      },
      {
        dir: 'cdn',
        format: 'es',
        // 保留模块目录 false则只是输出一个文件
        preserveModules: false,
        entryFileNames: '[name].esm.js',
        name: 'sdkName',
        generatedCode: {
          constBindings: useConst
        },
      },
      // umd模块
      {
        dir: 'cdn',
        format: 'umd',
        // 保留模块目录 false则只是输出一个文件
        preserveModules: false,
        entryFileNames: '[name].umd.js',
        name: 'sdkName',
        generatedCode: {
          constBindings: useConst
        },
      },
    ],
    external: ['axios'], // 只排除 axios，保留所有本地模块
    plugins: [
      // 注意：CDN 版本不使用 externals()，需要打包所有本地代码
      useEsbuild ? esbuild() : typescript({
        noEmitOnError: useThrowOnError,
        outDir: 'cdn',
        removeComments: true,
        compilerOptions: {
          module: 'esnext', // 解析的代码模块化
          target: 'es2015'  // 生成的代码模块化
        }
      })
    ]
  }
];
export default config