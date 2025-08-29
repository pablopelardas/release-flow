import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import https from 'https'
import http from 'http'

const RELEASE_SERVER_URL = 'https://devserver01.intuit.ar/ReleaseFlow'
const BUILD_OUTPUT_DIR = './out/make/squirrel.windows/x64'

// Función para subir archivo al servidor
async function uploadFile(filePath, endpoint, filename) {
  return new Promise((resolve, reject) => {
    const fileData = fs.readFileSync(filePath)
    const isHttps = RELEASE_SERVER_URL.startsWith('https')
    const url = new URL(`${RELEASE_SERVER_URL}${endpoint}`)
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Length': fileData.length,
        'x-filename': filename
      }
    }

    const client = isHttps ? https : http
    const req = client.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        try {
          const result = JSON.parse(data)
          if (res.statusCode === 200 || res.statusCode === 201) {
            resolve(result)
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${result.error || data}`))
          }
        } catch (e) {
          reject(new Error(`Error parsing response: ${data}`))
        }
      })
    })

    req.on('error', (e) => {
      reject(e)
    })

    req.write(fileData)
    req.end()
  })
}

// Función para subir contenido de texto
async function uploadTextContent(content, endpoint) {
  return new Promise((resolve, reject) => {
    const isHttps = RELEASE_SERVER_URL.startsWith('https')
    const url = new URL(`${RELEASE_SERVER_URL}${endpoint}`)
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'Content-Length': Buffer.byteLength(content)
      }
    }

    const client = isHttps ? https : http
    const req = client.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        try {
          const result = JSON.parse(data)
          if (res.statusCode === 200 || res.statusCode === 201) {
            resolve(result)
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${result.error || data}`))
          }
        } catch (e) {
          reject(new Error(`Error parsing response: ${data}`))
        }
      })
    })

    req.on('error', (e) => {
      reject(e)
    })

    req.write(content)
    req.end()
  })
}

async function publishVersion() {
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
  
  // Subir archivos al servidor
  console.log('\n📤 Subiendo archivos al servidor...')
  
  try {
    // Subir archivo RELEASES (contenido de texto)
    console.log('📄 Subiendo archivo RELEASES...')
    const releasesPath = path.join(BUILD_OUTPUT_DIR, 'RELEASES')
    const releasesContent = fs.readFileSync(releasesPath, 'utf8')
    await uploadTextContent(releasesContent, '/api/upload/releases')
    console.log('✅ RELEASES subido')

    // Subir archivo .nupkg (archivo binario)
    console.log(`📦 Subiendo ${`releaseflow_electron-${currentVersion}-full.nupkg`}...`)
    const nupkgPath = path.join(BUILD_OUTPUT_DIR, `releaseflow_electron-${currentVersion}-full.nupkg`)
    await uploadFile(nupkgPath, '/api/upload/nupkg', `releaseflow_electron-${currentVersion}-full.nupkg`)
    console.log(`✅ ${`releaseflow_electron-${currentVersion}-full.nupkg`} subido`)

    // Subir instalador (archivo binario)
    if (setupFile) {
      console.log(`📥 Subiendo instalador ${setupFile}...`)
      const setupPath = path.join(BUILD_OUTPUT_DIR, setupFile)
      await uploadFile(setupPath, '/api/upload/installer', 'ReleaseFlow-Setup.exe')
      console.log(`✅ ${setupFile} → ReleaseFlow-Setup.exe subido`)
    }

    // Verificar si hay archivo delta y subirlo
    const deltaFile = `releaseflow_electron-${currentVersion}-delta.nupkg`
    const deltaPath = path.join(BUILD_OUTPUT_DIR, deltaFile)
    if (fs.existsSync(deltaPath)) {
      console.log(`📦 Subiendo archivo delta ${deltaFile}...`)
      await uploadFile(deltaPath, '/api/upload/nupkg', deltaFile)
      console.log(`✅ ${deltaFile} (archivo delta) subido`)
    }

    console.log(`\n🎉 Versión ${currentVersion} publicada exitosamente!`)
    console.log(`🌐 URL del servidor: ${RELEASE_SERVER_URL}`)
    console.log(`🔍 Debug: ${RELEASE_SERVER_URL}/api/versions`)
    
  } catch (error) {
    console.error('\n❌ Error subiendo archivos al servidor:', error.message)
    process.exit(1)
  }
}

publishVersion()