import fs from 'fs'
import path from 'path'

const RELEASE_SERVER_DIR = 'D:/release-flow-versions/releases'
const BUILD_OUTPUT_DIR = './out/make/squirrel.windows/x64'

function prepareDelta() {
  console.log('🔄 Preparando para generación de archivos delta...')
  
  // Crear directorio de salida si no existe
  if (!fs.existsSync(BUILD_OUTPUT_DIR)) {
    fs.mkdirSync(BUILD_OUTPUT_DIR, { recursive: true })
  }
  
  // Copiar archivos .nupkg anteriores desde el servidor al directorio de build
  const serverFiles = fs.readdirSync(RELEASE_SERVER_DIR)
  const nupkgFiles = serverFiles.filter(f => f.endsWith('.nupkg'))
  
  console.log(`📦 Encontrados ${nupkgFiles.length} archivos .nupkg en el servidor`)
  
  nupkgFiles.forEach(file => {
    const source = path.join(RELEASE_SERVER_DIR, file)
    const destination = path.join(BUILD_OUTPUT_DIR, file)
    
    // Solo copiar si no existe en destino
    if (!fs.existsSync(destination)) {
      fs.copyFileSync(source, destination)
      console.log(`✅ Copiado: ${file}`)
    } else {
      console.log(`⏭️ Ya existe: ${file}`)
    }
  })
  
  // También copiar el archivo RELEASES
  const releasesSource = path.join(RELEASE_SERVER_DIR, 'RELEASES')
  if (fs.existsSync(releasesSource)) {
    const releasesDestination = path.join(BUILD_OUTPUT_DIR, 'RELEASES')
    fs.copyFileSync(releasesSource, releasesDestination)
    console.log('✅ Copiado: RELEASES')
  }
  
  console.log('✅ Preparación completada. Squirrel ahora puede generar deltas.')
}

prepareDelta()