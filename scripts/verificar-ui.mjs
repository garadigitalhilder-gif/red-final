import { chromium, expect } from '@playwright/test'
import fs from 'node:fs'
import assert from 'node:assert/strict'

// Revisión automática en un navegador real; requiere npm run dev en el puerto 5173.
const rutaFuente = process.argv[2] ?? 'src/data/casos.json'
const fuente = JSON.parse(fs.readFileSync(rutaFuente, 'utf8'))
const casos = Array.isArray(fuente) ? fuente : fuente.casos
const estado = { version: 2, casoActual: casos.at(-1).id, respuestas: {}, pistas: {}, veredictos: {} }
for (const caso of casos) for (const p of caso.preguntas) {
  estado.respuestas[p.id] = p.tipo === 'abierta'
    ? { respuesta: 'evidencia '.repeat(80), autoevaluacion: p.rubrica.map(() => true), evaluada: true }
    : { respuesta: p.respuestaCorrecta }
}
fs.mkdirSync('artifacts/ui', { recursive: true })
const browser = await chromium.launch({ channel: 'msedge', headless: true })
try {
  const page = await browser.newPage()
  const sustituir = pagina => pagina.route('**/src/data/casos.json*', route => route.fulfill({
    contentType: 'application/javascript', body: 'export default ' + JSON.stringify(fuente) + ';'
  }))
  if (process.argv[2]) await sustituir(page)
  await page.goto('http://127.0.0.1:5173/')
  estado.firma = await page.evaluate(async () => {
    const { adaptarDatos } = await import('/src/data/datosJuego.js')
    const { firmaCatalogo } = await import('/src/hooks/juegoModelo.js')
    const datos = adaptarDatos()
    return firmaCatalogo(datos.casos, datos.juego.umbralAprobacion / 100)
  })
  const errores = []
  page.on('pageerror', error => errores.push(error.message))
  await page.addInitScript(estadoGuardado => {
    if (window.location.origin === 'http://127.0.0.1:5173') {
      window.localStorage.setItem('detectives-del-texto:juego:v1', JSON.stringify(estadoGuardado))
    }
  }, estado)
  const reporte = []
  for (const ancho of [320, 390, 1280]) {
    await page.setViewportSize({ width: ancho, height: 900 })
    for (const escala of [100, 200]) for (const ruta of ['/', '/briefing', ...casos.map(c => '/caso/' + c.id), '/veredicto', '/resultados', '/creditos']) {
      await page.goto('http://127.0.0.1:5173/#' + ruta)
      await page.getByRole('heading', { level: 1 }).waitFor()
      await page.addStyleTag({ content: `html { font-size: ${escala}% !important; }` })
      await page.addScriptTag({ path: 'node_modules/axe-core/axe.min.js' })
      const resultado = await page.evaluate(async () => {
        const auditoria = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })
        return { excesoHorizontal: document.documentElement.scrollWidth > innerWidth,
          fallos: auditoria.violations.map(v => ({ id: v.id, nodos: v.nodes.map(n => n.target) })) }
      })
      reporte.push({ ancho, escala, ruta, ...resultado })
      if ((ancho === 390 || ancho === 1280) && escala === 100) {
        await page.evaluate(() => document.activeElement?.blur())
        await page.screenshot({ path: 'artifacts/ui/' + ancho + '-' + (ruta === '/' ? 'inicio' : ruta.replaceAll('/', '-').slice(1)) + '.png', fullPage: true })
      }
      assert.equal(resultado.excesoHorizontal, false, 'Desbordamiento: ' + ancho + ' ' + escala + '% ' + ruta)
      assert.deepEqual(resultado.fallos, [], 'Accesibilidad: ' + ancho + ' ' + ruta + ' ' + JSON.stringify(resultado.fallos))
    }
    await page.goto('http://127.0.0.1:5173/#/caso/1')
    const texto = await page.getByRole('article').boundingBox()
    const formulario = await page.getByRole('form').first().boundingBox()
    assert.ok(ancho >= 1000 ? formulario.x > texto.x + texto.width : formulario.y > texto.y + texto.height, 'Distribución texto/preguntas: ' + ancho)
  }
  await page.goto('about:blank')
  await page.goto('http://127.0.0.1:5173/#/')
  await page.getByRole('heading', { level: 1 }).waitFor()
  await page.keyboard.press('Tab')
  assert.equal(await page.getByRole('link', { name: 'Saltar al contenido' }).evaluate(e => e === document.activeElement), true)
  await page.keyboard.press('Enter')
  assert.equal(await page.locator('main').evaluate(e => e === document.activeElement), true)
  // Un estado nuevo permite probar errores, opciones y pistas habilitadas.
  const nueva = await browser.newPage({ viewport: { width: 390, height: 900 } })
  if (process.argv[2]) await sustituir(nueva)
  await nueva.goto('http://127.0.0.1:5173/#/caso/1')
  const primera = nueva.getByRole('form').first()
  await primera.getByRole('button').focus()
  await nueva.keyboard.press('Enter')
  assert.equal(await primera.getByRole('radio').first().evaluate(e => e === document.activeElement), true)
  await expect(primera.getByRole('radio').first()).toHaveAttribute('aria-invalid', 'true')
  await nueva.keyboard.press('Space')
  await nueva.keyboard.press('ArrowDown')
  await nueva.keyboard.press('Tab')
  assert.equal(await primera.getByRole('button').evaluate(e => e === document.activeElement), true)
  await nueva.keyboard.press('Enter')
  await expect(primera.getByRole('button')).toHaveAttribute('aria-disabled', 'true')
  const pista = nueva.getByRole('complementary').nth(1).getByRole('button')
  await pista.focus()
  await nueva.keyboard.press('Enter')
  await expect(pista).toHaveAttribute('aria-expanded', 'true')
  await nueva.addScriptTag({ path: 'node_modules/axe-core/axe.min.js' })
  assert.deepEqual(await nueva.evaluate(async () => (await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })).violations.map(v => v.id)), [])
  await nueva.emulateMedia({ reducedMotion: 'reduce' })
  assert.equal(await nueva.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), true)
  await nueva.addStyleTag({ content: '* { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; } p { margin-bottom: 2em !important; }' })
  assert.equal(await nueva.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'Espaciado de texto')
  await nueva.close()
  assert.deepEqual(errores, [])
  fs.writeFileSync('artifacts/ui/reporte.json', JSON.stringify(reporte, null, 2))
  console.log(`${reporte.length} revisiones de páginas al 100 % y 200 % sin fallos WCAG automáticos ni desbordamiento; distribución responsive y salto por teclado verificados.`)
} finally {
  await browser.close()
}
