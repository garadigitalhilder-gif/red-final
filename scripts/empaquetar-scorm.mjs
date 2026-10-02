import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'
import { zipSync, unzipSync, strFromU8 } from 'fflate'

const raiz = fileURLToPath(new URL('../', import.meta.url))
const dist = path.join(raiz, 'dist')
const entradas = {}

// Las rutas internas parten de dist, sin incluir una carpeta contenedora.
async function recopilar(directorio, prefijo = '') {
  for (const entrada of await readdir(directorio, { withFileTypes: true })) {
    const archivo = path.join(directorio, entrada.name)
    const relativo = prefijo + entrada.name
    if (entrada.isDirectory()) await recopilar(archivo, relativo + '/')
    else if (entrada.isFile()) entradas[relativo] = new Uint8Array(await readFile(archivo))
    else throw new Error('No se empaquetan enlaces simbólicos: ' + relativo)
  }
}

await recopilar(dist)
assert.ok(entradas['index.html'], 'Falta index.html; ejecuta npm run build:scorm.')
assert.ok(entradas['imsmanifest.xml'], 'Falta el manifest que Vite copia desde public/.')
const manifest = strFromU8(entradas['imsmanifest.xml'])
assert.ok(!manifest.includes('<!-- ARCHIVOS_GENERADOS -->'), 'El manifest debe declarar los archivos finales del build.')
assert.match(manifest, /adlcp:scormtype="sco"/u)
assert.match(manifest, /<schemaversion>1\.2<\/schemaversion>/u)
const decodificar = valor => valor.replaceAll('&quot;', '"').replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&')
const declarados = [...manifest.matchAll(/<file\s+href="([^"]+)"/gu)].map(m => decodificar(m[1]))
assert.ok(declarados.includes('index.html'), 'El recurso debe declarar index.html.')
for (const nombre of declarados) assert.ok(entradas[nombre], 'Archivo declarado ausente: ' + nombre)
for (const nombre of Object.keys(entradas)) {
  if (nombre !== 'imsmanifest.xml') assert.ok(declarados.includes(nombre), 'Archivo no declarado: ' + nombre)
}
const imagenes = ['portada', 'caso1', 'caso2', 'caso3', 'caso4'].map(nombre => `img/${nombre}.webp`)
for (const ruta of imagenes) {
  assert.ok(entradas[ruta]?.length, 'Imagen requerida ausente o vacía en dist: ' + ruta)
  assert.ok(declarados.includes(ruta), 'Imagen no declarada: ' + ruta)
}

const carpeta = path.join(raiz, 'paquetes')
const destino = path.join(carpeta, 'detectives-del-texto-scorm12.zip')
await mkdir(carpeta, { recursive: true })
const zip = zipSync(entradas, { level: 9 })
await writeFile(destino, zip)
// Verifica el ZIP leído del disco y sus contenidos, además del directorio original.
const comprobacion = unzipSync(new Uint8Array(await readFile(destino)))
assert.deepEqual(Object.keys(comprobacion).sort(), Object.keys(entradas).sort())
for (const nombre of Object.keys(entradas)) assert.deepEqual(comprobacion[nombre], entradas[nombre])
assert.ok(Object.keys(comprobacion).some(nombre => nombre.startsWith('img/')), 'Falta la carpeta img/ del paquete.')
for (const ruta of imagenes) assert.ok(comprobacion[ruta]?.length, 'Imagen ausente del ZIP: ' + ruta)
console.log('ZIP SCORM 1.2 generado y comprobado: ' + destino)
console.log(`${Object.keys(entradas).length} archivos; index.html e imsmanifest.xml en la raíz; ${(zip.length / 1024).toFixed(1)} KiB.`)
if (manifest.includes('[COMPLETAR]')) console.log('Metadatos pendientes: sustituye [COMPLETAR] con los nombres del grupo y vuelve a generar el ZIP.')
console.log('Contenido del ZIP:')
for (const nombre of Object.keys(comprobacion).sort()) console.log(`  ${nombre} (${(comprobacion[nombre].length / 1024).toFixed(2)} KB)`)
