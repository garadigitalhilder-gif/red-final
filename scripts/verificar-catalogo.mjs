import { chromium, expect } from '@playwright/test'
import fs from 'node:fs'
import assert from 'node:assert/strict'

// Sirve el JSON elegido solo a este navegador, sin modificar archivos del proyecto.
const ruta = process.argv[2] ?? 'src/data/casos.json'
const fuente = JSON.parse(fs.readFileSync(ruta, 'utf8'))
assert.ok(!Array.isArray(fuente), 'Esta prueba requiere el objeto nuevo con juego, creditos y casos.')
const browser = await chromium.launch({ channel: 'msedge', headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } })
  const errores = []
  page.on('pageerror', error => errores.push(error.message))
  await page.route('**/src/data/casos.json*', route => route.fulfill({
    contentType: 'application/javascript', body: 'export default ' + JSON.stringify(fuente) + ';'
  }))
  await page.goto('http://127.0.0.1:5173/#/briefing')
  await page.getByRole('link', { name: 'Abrir expediente', exact: true }).click()
  const maximo = fuente.casos.flatMap(c => c.preguntas).reduce((total, p) => total + (p.puntos ?? fuente.juego.puntosPorPregunta), 0)
  for (const caso of fuente.casos) {
    await expect(page.getByRole('heading', { level: 1, name: caso.titulo, exact: true })).toBeVisible()
    const articulo = page.getByRole('article', { name: caso.texto.titulo, exact: true })
    await expect(articulo).toContainText(String(caso.texto.anio))
    await expect(articulo).toContainText(caso.texto.autor)
    if (caso.advertencia) {
      await expect(page.getByRole('note')).toContainText(caso.advertencia)
      await page.getByRole('button', { name: 'Entendido, continuar' }).focus()
      await page.keyboard.press('Enter')
      await expect(articulo.getByRole('heading')).toBeFocused()
    }
    if (caso.contexto) await expect(page.getByText(caso.contexto, { exact: true })).toBeVisible()
    if (caso.texto.contenido.includes('[…]')) await expect(articulo.getByText('[…]', { exact: true })).toBeVisible()
    if (caso.glosario.length) {
      const boton = page.getByRole('button', { name: 'Vocabulario' })
      await boton.focus(); await page.keyboard.press('Enter')
      await expect(boton).toHaveAttribute('aria-expanded', 'true')
      await expect(page.getByText(caso.glosario[0].significado, { exact: true })).toBeVisible()
      await page.keyboard.press('Enter')
      await expect(boton).toHaveAttribute('aria-expanded', 'false')
    }
    for (const pregunta of caso.preguntas.filter(p => p.tipo !== 'abierta')) {
      const form = page.getByRole('form', { name: pregunta.enunciado, exact: true })
      const opcion = pregunta.opciones.find(o => o.id === pregunta.respuestaCorrecta)
      await form.getByRole('radio', { name: opcion.texto, exact: true }).check()
      await form.getByRole('button').click()
      await expect(form.getByRole('button')).toHaveAttribute('aria-disabled', 'true')
    }
    await page.getByRole('link', { name: 'Ir al veredicto' }).click()
    const abierta = caso.preguntas.find(p => p.tipo === 'abierta')
    if (abierta) {
      const form = page.getByRole('form', { name: abierta.enunciado, exact: true })
      await expect(form.getByRole('checkbox')).toHaveCount(0)
      await form.getByRole('textbox').fill('evidencia '.repeat(80).trim())
      await form.getByRole('button', { name: 'Enviar texto y autoevaluar' }).click()
      const casillas = form.getByRole('checkbox')
      await expect(casillas).toHaveCount(abierta.rubrica.length)
      for (const casilla of await casillas.all()) await casilla.check()
      await expect(form).toContainText('Puntos obtenidos: ' + abierta.puntos)
      await casillas.first().uncheck()
      await expect(form).toContainText('Puntos obtenidos: ' + Math.max(0, abierta.puntos - abierta.rubrica[0].puntos))
      await casillas.first().check()
      await form.getByRole('textbox').fill('postura '.repeat(90).trim())
      await form.getByRole('button', { name: 'Guardar cambios del texto' }).click()
      await page.reload()
      await expect(page.getByRole('textbox')).toHaveValue('postura '.repeat(90).trim())
      await expect(page.getByRole('checkbox').first()).toBeChecked()
    }
    const insignia = fuente.juego.insignias.find(i => i.casoRequerido === caso.id)
    if (insignia) await expect(page.getByRole('heading', { name: insignia.nombre, exact: true })).toBeVisible()
    if (caso !== fuente.casos.at(-1)) await page.getByRole('link', { name: 'Abrir siguiente caso' }).click()
  }
  await page.getByRole('link', { name: 'Ver resultados' }).click()
  await expect(page.getByRole('status', { name: 'Puntaje total' })).toContainText(`${maximo} / ${maximo}`)
  await page.locator('main').getByRole('link', { name: 'Créditos y fuentes' }).click()
  for (const credito of fuente.creditos) {
    await expect(page.getByRole('heading', { name: credito.obra, exact: true })).toBeVisible()
    if (credito.url) await expect(page.locator('main').getByRole('link', { name: credito.fuente, exact: true })).toHaveAttribute('href', credito.url)
  }
  await page.addScriptTag({ path: 'node_modules/axe-core/axe.min.js' })
  const fallos = await page.evaluate(async () => (await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })).violations.map(v => v.id))
  assert.deepEqual(fallos, [])
  assert.deepEqual(errores, [])
  console.log('Catálogo nuevo: cuatro casos, aviso, contexto, glosarios, rúbrica editable, recuperación, insignias y créditos verificados sin modificar casos.json.')
} finally { await browser.close() }
