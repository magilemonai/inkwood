import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  // Custom domain (inkwood.codywymore.com) serves from root, so no
  // /inkwood/ prefix on built asset paths.
  base: '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg', 'og-image.png'],
      manifest: {
        name: 'Inkwood',
        short_name: 'Inkwood',
        description: 'A cozy, meditative typing game where your words bring a dormant world back to life.',
        theme_color: '#060806',
        background_color: '#060806',
        display: 'standalone',
        orientation: 'any',
        scope: '/',
        start_url: '/',
        icons: [
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        // The Glow layer's three.js chunk is gated (?glow) and lazy-loaded;
        // keep it out of the precache so players on the classic game never
        // download it. It's fetched on demand the first time a gate is on.
        globIgnores: ['**/GlowCanvas-*.js'],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'document',
            handler: 'NetworkFirst',
            options: { cacheName: 'inkwood-html' },
          },
        ],
      },
    }),
  ],
})
