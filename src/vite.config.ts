import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Custom plugin to handle figma:asset imports
function figmaAssetPlugin() {
  return {
    name: 'figma-asset-plugin',
    resolveId(id: string) {
      if (id.startsWith('figma:asset/')) {
        return id;
      }
    },
    load(id: string) {
      if (id.startsWith('figma:asset/')) {
        const assetPath = id.replace('figma:asset/', '');
        return `export default "/placeholder-${assetPath}"`;
      }
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), figmaAssetPlugin()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      // ─── Figma Make uses versioned specifiers that don't exist as real npm
      //     package names. Map each one to the actual installed package so
      //     Vite (and Rollup) can resolve them during production builds. ───
      'sonner@2.0.3': 'sonner',
      'react-hook-form@7.55.0': 'react-hook-form',
    }
  },

  build: {
    // !! Must match netlify.toml publish directory !!
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2020',
    rollupOptions: {
      output: {
        // Let Rollup decide automatic chunking — avoids oversized bundles
        manualChunks: undefined,
      },
      onwarn(warning, warn) {
        // Silence noisy-but-harmless warnings
        if (warning.code === 'UNUSED_EXTERNAL_IMPORT') return;
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
        warn(warning);
      },
    },
    chunkSizeWarningLimit: 3000,
  },

  server: {
    port: 5173,
    host: true,
  },

  preview: {
    port: 4173,
    host: true,
  },

  envPrefix: 'VITE_',

  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@supabase/supabase-js',
      'sonner',
      'react-hook-form',
    ],
  },

  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
  },
});
