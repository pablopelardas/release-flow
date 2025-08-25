import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron'
import path from 'path'

export default defineConfig({
  plugins: [
    vue(),
    electron({
      entry: 'src/main/main.js',
      vite: {
        build: {
          outDir: 'dist-electron/main',
          rollupOptions: {
            external: ['electron']
          }
        }
      }
    }),
    electron({
      entry: 'src/preload/preload.js',
      onstart(options) {
        options.reload()
      },
      vite: {
        build: {
          outDir: 'dist-electron/preload',
          rollupOptions: {
            external: ['electron']
          }
        }
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@main': path.resolve(__dirname, 'src/main'),
      '@renderer': path.resolve(__dirname, 'src/renderer'),
      '@preload': path.resolve(__dirname, 'src/preload')
    }
  },
  server: {
    port: 5173,
    hmr: true
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})