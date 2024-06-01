import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  resolve:{
    alias:[
      { find: '@', replacement: '/src' },
      { find: '@components', replacement: '/src/components' },
    ]
  },
  plugins: [vue()],
})
