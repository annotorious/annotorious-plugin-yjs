import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      include: ['./src/'],
      entryRoot: './src'
    })
  ],
  server: {
    open: '/test/index.html'
  },
  build: {
    sourcemap: true,
    lib: {
      entry: './src/index.ts',
      name: 'AnnotoriousYJS',
      formats: ['es', 'umd'],
      fileName: (format) => 
        format === 'umd' ? `annotorious-yjs.js` : `annotorious-yjs.es.js`
    },
    rollupOptions: {
      output: {
        assetFileNames: 'annotorious-yjs.[ext]'
      }
    }
  }
});