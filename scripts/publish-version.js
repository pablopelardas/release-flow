import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const RELEASE_SERVER_DIR = 'D:/release-flow-versions/releases'
const BUILD_OUTPUT_DIR = './out/make/squirrel.windows/x64'

function publishVersion() {
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'))
  const currentVersion = packageJson.version
  
  console.log(`\n🚀 Publicando versión ${currentVersion}...`)
  
  // Verificar que los archivos existen
  const files = [
    'RELEASES',
    `releaseflow_electron-${currentVersion}-full.nupkg`
  ]
  
  // Buscar el archivo del setup (nombre puede variar)
  let setupFile = null
  if (fs.existsSync(path.join(BUILD_OUTPUT_DIR, 'ReleaseFlow-Setup.exe'))) {
    setupFile = 'ReleaseFlow-Setup.exe'
  } else if (fs.existsSync(path.join(BUILD_OUTPUT_DIR, `releaseflow-electron-${currentVersion} Setup.exe`))) {
    setupFile = `releaseflow-electron-${currentVersion} Setup.exe`
  }
  
  if (setupFile) {
    files.push(setupFile)
  } else {
    console.error(`❌ No se encontró archivo de instalación. Buscando:`)
    console.error(`   - ReleaseFlow-Setup.exe`)
    console.error(`   - releaseflow-electron-${currentVersion} Setup.exe`)
  }
  
  let allFilesExist = true
  files.forEach(file => {
    const filePath = path.join(BUILD_OUTPUT_DIR, file)
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Archivo no encontrado: ${filePath}`)
      allFilesExist = false
    }
  })
  
  if (!allFilesExist) {
    console.error('\n❌ Primero ejecuta: npm run build && npx electron-forge make --targets=@electron-forge/maker-squirrel')
    console.error('💡 O usa el comando completo: npm run release')
    process.exit(1)
  }
  
  // Crear directorio del servidor si no existe
  if (!fs.existsSync(RELEASE_SERVER_DIR)) {
    fs.mkdirSync(RELEASE_SERVER_DIR, { recursive: true })
  }
  
  // Copiar archivos al servidor
  console.log('\n📁 Copiando archivos al servidor...')
  files.forEach(file => {
    const source = path.join(BUILD_OUTPUT_DIR, file)
    
    // Si es el archivo de setup, siempre copiarlo como ReleaseFlow-Setup.exe
    let destination
    if (file === setupFile) {
      destination = path.join(RELEASE_SERVER_DIR, 'ReleaseFlow-Setup.exe')
      console.log(`✅ ${file} → ReleaseFlow-Setup.exe`)
    } else {
      destination = path.join(RELEASE_SERVER_DIR, file)
      console.log(`✅ ${file}`)
    }
    
    fs.copyFileSync(source, destination)
  })
  
  // Verificar si hay archivo delta
  const deltaFile = `releaseflow_electron-${currentVersion}-delta.nupkg`
  const deltaPath = path.join(BUILD_OUTPUT_DIR, deltaFile)
  if (fs.existsSync(deltaPath)) {
    fs.copyFileSync(deltaPath, path.join(RELEASE_SERVER_DIR, deltaFile))
    console.log(`✅ ${deltaFile} (archivo delta)`)
  }
  
  console.log(`\n🎉 Versión ${currentVersion} publicada exitosamente!`)
  console.log(`📍 Archivos disponibles en: ${RELEASE_SERVER_DIR}`)
  console.log(`🌐 URL del servidor: http://localhost:3001/releases/`)
  console.log(`🔍 Debug: http://localhost:3001/api/versions`)
}

publishVersion()