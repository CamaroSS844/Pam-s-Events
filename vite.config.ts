import fs from 'fs';
import tailwindcss from '@tailwindcss/vite';
import dotenv from 'dotenv';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  const envFiles = ['.env', '.env.local', '.env.development', '.env.development.local'];
  const exampleEnvPath = path.resolve(process.cwd(), '.env.example');

  const loadedEnv = envFiles.reduce<Record<string, string>>((accumulator, fileName) => {
    const filePath = path.resolve(process.cwd(), fileName);

    if (!fs.existsSync(filePath)) {
      return accumulator;
    }

    return {
      ...accumulator,
      ...dotenv.parse(fs.readFileSync(filePath)),
    };
  }, {});

  if (fs.existsSync(exampleEnvPath)) {
    Object.assign(loadedEnv, dotenv.parse(fs.readFileSync(exampleEnvPath)));
  }

  const googleMapsKey = (
    process.env.GOOGLE_MAPS_PLATFORM_KEY ||
    loadedEnv.GOOGLE_MAPS_PLATFORM_KEY ||
    loadedEnv.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
    ''
  );

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    define: {
      'process.env.GOOGLE_MAPS_PLATFORM_KEY': JSON.stringify(googleMapsKey),
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true as const,
      // HMR can be disabled during automated edits via DISABLE_HMR.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during automated runs.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
