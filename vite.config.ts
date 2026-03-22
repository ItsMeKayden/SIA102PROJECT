import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': [
            'react',
            'react-dom',
            '@mui/material',
            '@mui/icons-material',
            'react-router-dom',
          ],
          'supabase': ['@supabase/supabase-js'],
        },
      },
    },
  },
})
