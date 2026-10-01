// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App.jsx'
import casos from '../data/casos.json'

beforeEach(() => {
  window.localStorage.clear()
  window.HTMLElement.prototype.scrollIntoView = vi.fn()
})
afterEach(() => { cleanup(); window.location.hash = ''; window.localStorage.clear() })

it('conecta briefing, caso, veredicto y resultados y permite reiniciar', async () => {
  const user = userEvent.setup()
  window.location.hash = '/briefing'
  render(<App />)
  expect(screen.getByRole('heading', { name: 'Briefing de la misión' })).toBeTruthy()
  await user.click(screen.getByRole('link', { name: 'Abrir expediente' }))
  expect(screen.queryByRole('heading', { name: 'Aprendiz' })).toBeNull()
  for (const pregunta of casos[0].preguntas) {
    const form = screen.getByRole('form', { name: pregunta.enunciado })
    const opcion = pregunta.opciones.find(o => o.id === pregunta.respuestaCorrecta)
    await user.click(within(form).getByRole('radio', { name: opcion.texto }))
    await user.click(within(form).getByRole('button'))
  }
  await user.click(screen.getByRole('link', { name: 'Ir al veredicto' }))
  expect(screen.getByText('✓ Meta del 70% alcanzada')).toBeTruthy()
  expect(screen.getByRole('heading', { name: 'Aprendiz' })).toBeTruthy()
  expect(screen.getByRole('link', { name: 'Abrir siguiente caso' }).getAttribute('href')).toBe('#/caso/2')
  await user.click(screen.getByRole('link', { name: 'Ver resultados' }))
  expect(screen.getByRole('heading', { name: 'Resultados de la investigación' })).toBeTruthy()
  expect(screen.getByRole('status', { name: 'Puntaje total' }).textContent).toContain('100 / 400')
  await user.click(screen.getByRole('button', { name: 'Reiniciar el juego' }))
  expect(screen.getByRole('heading', { name: 'Briefing de la misión' })).toBeTruthy()
  expect(screen.getByRole('status', { name: 'Puntaje total' }).textContent).toContain('0 / 400')
  await user.click(screen.getByRole('link', { name: 'Abrir expediente' }))
  expect(screen.getAllByRole('button', { name: 'Comprobar respuesta' })).toHaveLength(5)
})

it('impide abrir un caso bloqueado por URL directa', () => {
  window.location.hash = '/caso/2'
  render(<App />)
  expect(screen.getByRole('heading', { name: 'Bloqueado' })).toBeTruthy()
  expect(screen.queryByRole('form')).toBeNull()
})

it('impide consultar el veredicto de un nivel sin terminar', () => {
  window.location.hash = '/veredicto'
  render(<App />)
  expect(screen.getByText(/Termina las preguntas del caso actual/)).toBeTruthy()
  expect(screen.getByRole('link', { name: 'Volver al caso' }).getAttribute('href')).toBe('#/caso/1')
})

it('permite terminar los cuatro casos, autoevaluar el veredicto y recuperar la insignia final', async () => {
  const user = userEvent.setup()
  window.location.hash = '/caso/1'
  const view = render(<App />)
  for (const caso of casos) {
    for (const pregunta of caso.preguntas) {
      if (pregunta.tipo === 'abierta') await user.click(screen.getByRole('link', { name: 'Ir al veredicto' }))
      const form = screen.getByRole('form', { name: pregunta.enunciado })
      if (pregunta.tipo === 'abierta') {
        const texto = 'Considero que los menores necesitan acompañamiento para utilizar las redes sociales con responsabilidad. Una prohibición total puede dejar sin resolver los riesgos cuando se accede a escondidas. Además, aprender a cuidar la privacidad y reconocer contenidos engañosos ayuda a tomar decisiones informadas. Es cierto que limitar el acceso puede reducir algunas situaciones de presión social; sin embargo, también necesitamos educación y supervisión familiar. Por eso propongo límites de tiempo, cuentas privadas y orientación según la edad. Estas medidas deberían revisarse con evidencias sobre sus resultados y escuchar las experiencias de los propios jóvenes.'
        expect(texto.split(/\s+/).length).toBeGreaterThanOrEqual(80)
        expect(texto.split(/\s+/).length).toBeLessThanOrEqual(120)
        await user.click(within(form).getByRole('textbox'))
        await user.paste(texto)
        await user.click(within(form).getByRole('button'))
        expect(within(form).getByRole('alert').textContent).toContain('Valora todos los criterios')
        for (const radio of within(form).getAllByRole('radio', { name: 'Sí, lo cumplo' })) await user.click(radio)
      } else {
        await user.click(within(form).getByRole('radio', { name: pregunta.opciones.find(o => o.id === pregunta.respuestaCorrecta).texto }))
      }
      await user.click(within(form).getByRole('button'))
    }
    if (!caso.preguntas.some(p => p.tipo === 'abierta')) await user.click(screen.getByRole('link', { name: 'Ir al veredicto' }))
    if (caso.id < 4) await user.click(screen.getByRole('link', { name: 'Abrir siguiente caso' }))
  }
  expect(screen.getByRole('heading', { name: 'Maestro del Veredicto' })).toBeTruthy()
  view.unmount()
  render(<App />)
  expect(screen.getByRole('heading', { name: 'Maestro del Veredicto' })).toBeTruthy()
  await user.click(screen.getByRole('link', { name: 'Ver resultados' }))
  expect(screen.getByRole('status', { name: 'Puntaje total' }).textContent).toContain('400 / 400')
  expect(screen.getByText('✓ Autoevaluación registrada')).toBeTruthy()
}, 15000)

it('el diagnóstico ofrece feedback sin modificar el puntaje', async () => {
  const user = userEvent.setup()
  window.location.hash = '/briefing'
  render(<App />)
  for (const pregunta of casos[0].diagnostico) {
    const form = screen.getByRole('form', { name: pregunta.enunciado })
    await user.click(within(form).getByRole('radio', { name: pregunta.opciones.find(o => o.id === pregunta.respuestaCorrecta).texto }))
    await user.click(within(form).getByRole('button'))
    expect(within(form).getByText(pregunta.retroalimentacionCorrecta)).toBeTruthy()
  }
  expect(screen.getByText(/Diagnóstico completado/)).toBeTruthy()
  expect(screen.getByRole('status', { name: 'Puntaje total' }).textContent).toContain('0 / 400')
})

it('guarda el veredicto de reflexión y su rúbrica sin cambiar los puntos del caso', async () => {
  const user = userEvent.setup()
  window.localStorage.setItem('detectives-del-texto:juego:v1', JSON.stringify({
    version: 1, casoActual: 1, respuestas: Object.fromEntries(casos[0].preguntas.map(p => [p.id, { respuesta: p.respuestaCorrecta }])), pistas: {}
  }))
  window.location.hash = '/veredicto'
  const view = render(<App />)
  const texto = 'evidencia '.repeat(80).trim()
  await user.click(screen.getByRole('textbox'))
  await user.paste(texto)
  for (const radio of screen.getAllByRole('radio', { name: 'Sí, lo cumplo' })) await user.click(radio)
  await user.click(screen.getByRole('button', { name: 'Comprobar respuesta' }))
  expect(JSON.parse(window.localStorage.getItem('detectives-del-texto:juego:v1')).veredictos['1'].puntos).toBe(20)
  view.unmount()
  render(<App />)
  expect(screen.getByRole('textbox').value).toBe(texto)
  expect(screen.getByText('✓ Autoevaluación registrada')).toBeTruthy()
  await user.click(screen.getByRole('link', { name: 'Ver resultados' }))
  expect(screen.getByRole('status', { name: 'Puntaje total' }).textContent).toContain('100 / 400')
})
