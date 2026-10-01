import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

// Completa la copia de dist con los nombres finales de los archivos de Vite.
// public/imsmanifest.xml permanece como plantilla editable.
export default function scormManifestPlugin() {
  let salida
  async function archivos(directorio, prefijo = '') {
    const encontrados = []
    for (const entrada of await readdir(directorio, { withFileTypes: true })) {
      const relativo = prefijo + entrada.name
      if (entrada.isDirectory()) encontrados.push(...await archivos(path.join(directorio, entrada.name), relativo + '/'))
      else encontrados.push(relativo)
    }
    return encontrados
  }
  const escapar = valor => valor.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  return {
    name: 'scorm-manifest-files',
    apply: 'build',
    configResolved(config) { salida = path.resolve(config.root, config.build.outDir) },
    async writeBundle() {
      const destino = path.join(salida, 'imsmanifest.xml')
      const plantilla = await readFile(destino, 'utf8')
      const lista = (await archivos(salida)).filter(nombre => !['index.html', 'imsmanifest.xml'].includes(nombre)).sort()
      const nodos = lista.map(nombre => '<file href="' + escapar(nombre) + '" />').join('\n      ')
      await writeFile(destino, plantilla.replace('<!-- ARCHIVOS_GENERADOS -->', nodos), 'utf8')
    }
  }
}
