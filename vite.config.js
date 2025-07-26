import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    chunkSizeWarningLimit: 2500, // Increased for embeddedJournals chunk
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Embedded data - separate chunk for large data
          if (id.includes('embeddedJournals')) {
            return 'embeddedJournals';
          }
          
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('lucide-react')) {
              return 'icons';
            }
            if (id.includes('xlsx') || id.includes('file-saver')) {
              return 'file-utils';
            }
            return 'vendor';
          }
          
          // Translation chunks - separate each language and priority
          if (id.includes('translations/')) {
            if (id.includes('pt-critical.js')) {
              return 'translations-pt-critical';
            }
            if (id.includes('en-critical.js')) {
              return 'translations-en-critical';
            }
            if (id.includes('pt-noncritical.js')) {
              return 'translations-pt-noncritical';
            }
            if (id.includes('en-noncritical.js')) {
              return 'translations-en-noncritical';
            }
            if (id.includes('pt.js')) {
              return 'translations-pt-full';
            }
            if (id.includes('en.js')) {
              return 'translations-en-full';
            }
            return 'translations';
          }
          
          // Utility chunks
          if (id.includes('utils/') && !id.includes('translations')) {
            if (id.includes('lazyTranslations') || id.includes('performance')) {
              return 'utils-performance';
            }
            if (id.includes('exportUtils') || id.includes('dataProcessor')) {
              return 'utils-heavy';
            }
            return 'utils';
          }
          
          // Hook chunks
          if (id.includes('hooks/')) {
            return 'hooks';
          }
          
          // Component chunks
          if (id.includes('components/')) {
            // Large components get their own chunks
            if (id.includes('JournalSearchApp') || id.includes('OptimizedResultsTable')) {
              return 'components-main';
            }
            if (id.includes('LoadingScreen') || id.includes('ErrorScreen')) {
              return 'components-screens';
            }
            if (id.includes('JournalCellWithExpansion')) {
              return 'components-cells';
            }
            return 'components';
          }
          
          // Context chunks
          if (id.includes('contexts/')) {
            return 'contexts';
          }
        }
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
        passes: 2
      },
      mangle: {
        safari10: true
      },
      format: {
        comments: false
      }
    },
    // Enable tree shaking
    treeshake: {
      moduleSideEffects: false,
      propertyReadSideEffects: false,
      unknownGlobalSideEffects: false
    },
    // Optimize chunk loading
    target: 'es2015',
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
    // Preload critical chunks
    modulePreload: {
      polyfill: true
    }
  },
  base: './',
  publicDir: 'public',
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: ['@vite/client', '@vite/env']
  }
});
