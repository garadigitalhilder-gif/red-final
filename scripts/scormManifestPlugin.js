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
      let plantilla = await readFile(destino, 'utf8')
      const disponibles = await archivos(salida)
      // La plantilla declara las imágenes previstas; el ZIP solo declara archivos existentes.
      plantilla = plantilla.replace(/\s*<file href="(img\/[^"&]+\.webp)"\s*\/>/gu, (nodo, nombre) => {
        if (disponibles.includes(nombre)) return nodo
        console.warn('Imagen pendiente, omitida del manifiesto generado: ' + nombre)
        return ''
      })
      const yaDeclarados = [...plantilla.matchAll(/<file\s+href="([^"]+)"/gu)].map(m => m[1])
      const lista = disponibles.filter(nombre => nombre !== 'imsmanifest.xml' && !yaDeclarados.includes(escapar(nombre))).sort()
      const nodos = lista.map(nombre => '<file href="' + escapar(nombre) + '" />').join('\n      ')
      await writeFile(destino, plantilla.replace('<!-- ARCHIVOS_GENERADOS -->', nodos), 'utf8')
    }
  }
}
