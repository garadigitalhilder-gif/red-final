import { chromium } from '@playwright/test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const casos = JSON.parse(fs.readFileSync('src/data/casos.json', 'utf8'))
const browser = await chromium.launch({ channel: 'msedge', headless: true })
try {
  const page = await browser.newPage()
  const errores = []
  page.on('pageerror', error => errores.push(error.message))
  await page.goto('http://127.0.0.1:5173/scorm-demo.html')
  const juego = page.frameLocator('iframe')
  await juego.getByRole('link', { name: 'Comenzar caso' }).click()
  await juego.getByRole('link', { name: 'Abrir expediente' }).click()
  const pregunta = casos[0].preguntas[0]
  const form = juego.getByRole('form', { name: pregunta.enunciado })
  await form.getByRole('radio', { name: pregunta.opciones.find(o => o.id === pregunta.respuestaCorrecta).texto }).check()
  await form.getByRole('button', { name: 'Comprobar respuesta' }).click()
  await page.waitForFunction(() => window.API.LMSGetValue('cmi.core.score.raw') === '5')
  const valores = await page.evaluate(() => ({
    estado: window.API.LMSGetValue('cmi.core.lesson_status'),
    raw: window.API.LMSGetValue('cmi.core.score.raw'),
    ubicacion: window.API.LMSGetValue('cmi.core.lesson_location'),
    suspend: window.API.LMSGetValue('cmi.suspend_data').length
  }))
  assert.equal(valores.estado, 'incomplete')
  assert.equal(valores.raw, '5')
  assert.equal(valores.ubicacion, '/caso/1')
  assert.ok(valores.suspend > 0 && valores.suspend <= 4096)
  await page.evaluate(() => localStorage.removeItem('detectives-del-texto:juego:v1'))
  await page.reload()
  await juego.getByRole('link', { name: 'Comenzar caso' }).click()
  await juego.getByRole('link', { name: 'Continuar investigación' }).click()
  await juego.getByRole('form', { name: pregunta.enunciado }).getByRole('button', { name: 'Respuesta registrada' }).waitFor()
  await juego.getByRole('link', { name: 'Informe final' }).click()
  await juego.getByRole('button', { name: 'Guardar y finalizar sesión' }).click()
  await juego.getByText(/Sesión guardada y finalizada/).waitFor()
  assert.ok((await page.locator('#llamadas').textContent()).includes('LMSFinish'))
  assert.equal(await juego.getByRole('button', { name: 'Guardar y finalizar sesión' }).isDisabled(), true)
  assert.ok((await page.locator('#llamadas').textContent()).includes('LMSFinish() → true'))
  assert.deepEqual(errores, [])
  console.log('SCORM en iframe: API del padre detectada, commit, recuperación desde LMS y Finish verificados.')
} finally { await browser.close() }
