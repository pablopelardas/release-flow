const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');
const fs = require('fs');
const path = require('path');

module.exports = {
  hooks: {
    preMake: async () => {
      console.log('🔄 [Hook preMake] Preparando archivos para generación de deltas...');
      
      const RELEASE_SERVER_DIR = 'D:/release-flow-versions/releases';
      const BUILD_OUTPUT_DIR = path.join(__dirname, 'out/make/squirrel.windows/x64');
      
      // Crear directorio si no existe
      if (!fs.existsSync(BUILD_OUTPUT_DIR)) {
        fs.mkdirSync(BUILD_OUTPUT_DIR, { recursive: true });
      }
      
      // Copiar archivos .nupkg y RELEASES desde el servidor
      if (fs.existsSync(RELEASE_SERVER_DIR)) {
        const files = fs.readdirSync(RELEASE_SERVER_DIR);
        
        files.forEach(file => {
          if (file.endsWith('.nupkg') || file === 'RELEASES') {
            const source = path.join(RELEASE_SERVER_DIR, file);
            const destination = path.join(BUILD_OUTPUT_DIR, file);
            
            try {
              fs.copyFileSync(source, destination);
              console.log(`  ✅ Copiado: ${file}`);
            } catch (error) {
              console.log(`  ⚠️ Error copiando ${file}:`, error.message);
            }
          }
        });
      }
      
      console.log('✅ [Hook preMake] Preparación completada');
    }
  },
  packagerConfig: {
    asar: true,
    icon: './src/assets/icon', // Asumiendo que tendremos un icono
    name: 'ReleaseFlow',
    productName: 'ReleaseFlow Desktop',
    description: 'Aplicación Electron para gestión automatizada de releases',
    copyright: 'Copyright © 2025 Intuit Development Team',
    ignore: [
      /^\/src/,
      /^\/tests/,
      /^\/\.git/,
      /^\/\.vscode/,
      /^\/\.idea/,
      /^\/node_modules\/\.cache/,
      /\.ts$/,
      /\.map$/,
      /^\/tsconfig/,
      /^\/vitest/,
      /^\/postcss/,
      /^\/tailwind/,
      /^\/vite/,
      /^\/README/,
      /^\/DESARROLLO/,
      /^\/\.agent-os/
    ],
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'ReleaseFlowDesktop',
        authors: 'Intuit Development Team',
        description: 'Aplicación Electron para gestión automatizada de releases',
        // Crear accesos directos automáticamente
        setupExe: 'ReleaseFlow-Setup.exe',
        // Configurar iconos y URLs
        iconUrl: 'https://via.placeholder.com/256x256/0066cc/ffffff?text=RF',
        setupIcon: './src/assets/icon.ico',
        // Crear acceso directo en el escritorio
        createDesktopShortcut: true,
        // Crear acceso directo en menú inicio
        createStartMenuShortcut: true,
        // Configurar mensaje de instalación
        loadingGif: './src/assets/loading.gif',
        // No abrir la aplicación automáticamente después de instalar
        noMsi: true,
        // Habilitar generación de deltas
        remoteReleases: 'http://localhost:3001/releases/',
        // Alternativamente, usar carpeta local para deltas
        // remoteReleases: 'D:/release-flow-versions/releases/',
      },
    },
    {
      name: '@electron-forge/maker-zip',
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
