import fs from 'fs'
import { execSync } from 'child_process'

function bumpVersion(type = 'patch') {
  console.log(`\n🔢 Incrementando versión (${type})...`)
  
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'))
  const currentVersion = packageJson.version
  
  console.log(`📍 Versión actual: ${currentVersion}`)
  
  // Incrementar versión usando npm version
  try {
    const newVersion = execSync(`npm version ${type} --no-git-tag-version`, { encoding: 'utf8' }).trim()
    console.log(`🆙 Nueva versión: ${newVersion}`)
    
    console.log(`\n✅ Versión actualizada correctamente`)
    console.log(`💡 Ahora ejecuta: npm run release`)
    
    return newVersion
  } catch (error) {
    console.error('❌ Error incrementando versión:', error.message)
    process.exit(1)
  }
}

// Obtener tipo de versión desde argumentos
const type = process.argv[2] || 'patch'

if (!['patch', 'minor', 'major'].includes(type)) {
  console.error('❌ Tipo de versión debe ser: patch, minor, o major')
  process.exit(1)
}

bumpVersion(type)