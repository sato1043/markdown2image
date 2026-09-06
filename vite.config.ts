import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  // GitHub Pages の project site は https://<user>.github.io/<repo>/ 配下に置かれる。
  // dev / build で同じ値を使い、ローカルの preview で本番と同じ経路を再現する。
  base: '/markdown2image/',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
})
