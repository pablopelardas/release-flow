import { spawn } from 'child_process'
import path from 'path'

const serverPath = 'D:/release-flow-versions'

console.log('🚀 Iniciando servidor de actualizaciones...')
console.log(`📁 Directorio: ${serverPath}`)

const serverProcess = spawn('npm', ['start'], {
  cwd: serverPath,
  stdio: 'inherit',
  shell: true
})

serverProcess.on('error', (error) => {
  console.error('❌ Error iniciando servidor:', error.message)
})

serverProcess.on('exit', (code) => {
  console.log(`🔚 Servidor terminado con código: ${code}`)
})

// Manejar Ctrl+C
process.on('SIGINT', () => {
  console.log('\n🛑 Deteniendo servidor...')
  serverProcess.kill('SIGINT')
  process.exit(0)
})