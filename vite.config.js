import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import scormManifestPlugin from './scripts/scormManifestPlugin.js'

// Recursos relativos para publicar en subcarpetas y paquetes SCORM.
export default defineConfig({ plugins: [react(), scormManifestPlugin()], base: './' })
