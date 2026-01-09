import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  base: '/',

  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'query-vendor': ['@tanstack/react-query'],
        },
      },
    },
  },

  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['react', 'react-dom', 'react-router-dom'],
    force: false,
    esbuildOptions: {
      target: 'es2020',
    },
  },

  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    cors: {
      origin: '*',
      credentials: true,
    },

    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
      clientPort: 5173,
      overlay: true,
    },

    middlewareMode: false,

    headers: {
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=0, must-revalidate',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },

    fs: {
      strict: false,
      allow: ['..'],
    },

    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        timeout: 30000,
        ws: false,
      },
    },

    watch: {
      usePolling: false,
      interval: 100,
    },

    // Custom middleware to fix Content-Length issues and improve tunnel compatibility
    configureServer(server) {
      // Fix Content-Length issues for Vite client files and dependencies
      server.middlewares.use((req, res, next) => {
        const url = req.url || ''
        
        // Always set CORS headers for all requests (important for tunnel access)
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Range, If-Range')
        res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges')
        res.setHeader('Access-Control-Max-Age', '86400')
        
        // Handle preflight requests
        if (req.method === 'OPTIONS') {
          res.statusCode = 200
          res.end()
          return
        }
        
        // Fix Content-Length for Vite client files and node_modules
        if (url.includes('@vite/client') || 
            url.includes('@react-refresh') ||
            url.includes('node_modules') ||
            url.includes('.vite/deps') ||
            url.includes('/src/')) {
          // Intercept response headers to fix Content-Length
          const originalSetHeader = res.setHeader.bind(res)
          res.setHeader = function(name: string, value: string | number | string[]) {
            if (name.toLowerCase() === 'content-length' && 
                (url.includes('@vite/client') || url.includes('node_modules') || url.includes('.vite/deps'))) {
              // Skip setting Content-Length for these files to allow chunked encoding
              return res
            }
            return originalSetHeader(name, value)
          }
        }
        
        next()
      })
      
      // Fix WebSocket connection issues for HMR
      server.ws?.on('connection', (socket) => {
        socket.on('error', (err: Error) => {
          console.warn('WebSocket error:', err.message)
        })
      })
    },
  },

  preview: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    cors: {
      origin: '*',
      credentials: true,
    },
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  },

  /**
   * =========================
   * Vitest Configuration
   * =========================
   */
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/__tests__/setup.ts',

    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: './coverage',
    },
  },
})
