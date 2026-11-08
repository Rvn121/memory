import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        index: 'index.html',
        settings: 'settings.html',
        game: 'game.html',
        imprint: 'imprint.html',
      },
    },
  },
});
