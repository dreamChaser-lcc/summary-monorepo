import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: [
      { find: '@', replacement: '/src' },
      { find: '@components', replacement: '/src/components' },
      { find: '@store', replacement: '/src/store' },
    ],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8006',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  plugins: [vue()],
  // css: {
  //   preprocessorOptions: {
  //     scss: {
  //       // additionalData: `@import "@/styles/variables.scss";` // 可选，引入全局的 SCSS 变量文件
  //     }
  //   }
  // }
});
