// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import casos from '../data/casos.json'
import Pregunta from './Pregunta.jsx'
import Pista from './Pista.jsx'
import BarraProgreso from './BarraProgreso.jsx'
import Insignia from './Insignia.jsx'
import TextoCaso from './TextoCaso.jsx'
import Marcador from './Marcador.jsx'
import App from '../App.jsx'

beforeEach(() => { window.localStorage.clear() })
afterEach(() => { cleanup(); window.location.hash = ''; window.localStorage.clear() })
const pregunta = casos[0].preguntas[0]

describe('Interacción accesible', () => {
  it('anuncia la respuesta correcta y bloquea envíos duplicados por teclado', async () => {
    const user = userEvent.setup()
    const onResponder = vi.fn()
    render(<Pregunta pregunta={pregunta} onResponder={onResponder} />)
    await user.tab()
    expect(document.activeElement).toBe(screen.getAllByRole('radio')[0])
    await user.keyboard(' ')
    await user.tab()
    await user.keyboard('{Enter}')
    expect(onResponder).toHaveBeenCalledTimes(1)
    expect(onResponder.mock.calls[0][0]).toMatchObject({ correcta: true, puntos: 20 })
    expect(screen.getByText('✓ Respuesta correcta').closest('[aria-live]').getAttribute('aria-live')).toBe('polite')
    await user.keyboard('{Enter}')
    expect(onResponder).toHaveBeenCalledTimes(1)
  })

  it('muestra error cuando falta una opción y feedback específico cuando es incorrecta', async () => {
    const user = userEvent.setup()
    const onResponder = vi.fn()
    render(<Pregunta pregunta={pregunta} onResponder={onResponder} />)
    await user.click(screen.getByRole('button'))
    expect(screen.getByRole('alert').textContent).toContain('Selecciona')
    expect(document.activeElement).toBe(screen.getAllByRole('radio')[0])
    expect(document.activeElement.getAttribute('aria-invalid')).toBe('true')
    expect(onResponder).not.toHaveBeenCalled()
    await user.click(screen.getAllByRole('radio')[1])
    expect(screen.getByRole('alert').textContent).toBe('')
    await user.click(screen.getByRole('button'))
    expect(screen.getByText(pregunta.retroalimentacionIncorrecta)).toBeTruthy()
    expect(onResponder.mock.calls[0][0].puntos).toBe(0)
  })

  it('valida verdadero/falso y deja respuestas abiertas pendientes sin compararlas literalmente', async () => {
    const user = userEvent.setup()
    const view = render(<Pregunta pregunta={casos[0].preguntas[3]} />)
    await user.click(screen.getByRole('radio', { name: 'Falso' }))
    await user.click(screen.getByRole('button'))
    expect(screen.getByText('✓ Respuesta correcta')).toBeTruthy()
    view.unmount()
    const onResponder = vi.fn()
    render(<Pregunta pregunta={{ ...pregunta, tipo: 'abierta' }} onResponder={onResponder} />)
    await user.type(screen.getByRole('textbox', { name: 'Tu respuesta' }), 'Una postura con evidencia')
    await user.click(screen.getByRole('button'))
    expect(onResponder.mock.calls[0][0]).toMatchObject({ correcta: null, puntos: 0 })
    expect(screen.getByText(/pendiente de valoración/)).toBeTruthy()
    const texto = screen.getByRole('textbox', { name: 'Tu respuesta' })
    expect(texto.readOnly).toBe(true)
    expect(texto.disabled).toBe(false)
  })

  it('revela la pista con teclado y descuenta una sola vez', async () => {
    const user = userEvent.setup()
    const descontar = vi.fn()
    render(<Pista pista={pregunta.pista} costo={5} onDescontar={descontar} />)
    const boton = screen.getByRole('button')
    expect(boton.getAttribute('aria-expanded')).toBe('false')
    await user.tab()
    await user.keyboard('{Enter}{Enter}')
    expect(boton.getAttribute('aria-expanded')).toBe('true')
    expect(descontar).toHaveBeenCalledExactlyOnceWith(5)
    expect(screen.getByText(pregunta.pista).closest('[aria-live]')).toBeTruthy()
  })

  it('expone progreso por caso y juego con nombres y valores válidos', () => {
    render(<BarraProgreso casoCompletadas={2} casoTotal={5} juegoCompletadas={7} juegoTotal={20} />)
    const caso = screen.getByRole('progressbar', { name: 'Preguntas respondidas del caso' })
    expect(caso.getAttribute('value')).toBe('2')
    expect(caso.getAttribute('max')).toBe('5')
    expect(screen.getByRole('progressbar', { name: /juego disponible/ }).getAttribute('value')).toBe('7')
    expect(screen.getByText('2 / 5 · 40%')).toBeTruthy()
  })

  it('el progreso vacío es cero y el marcador nunca muestra valores negativos', () => {
    render(<><BarraProgreso /><Marcador puntos={-5} /></>)
    for (const barra of screen.getAllByRole('progressbar')) {
      expect(barra.getAttribute('value')).toBe('0')
      expect(barra.getAttribute('max')).toBe('1')
    }
    expect(screen.getByRole('status').textContent).toContain('0 puntos')
  })

  it('presenta las tres insignias y los créditos completos del texto', () => {
    render(<><Insignia /><Insignia nivel="detective" /><Insignia nivel="inspector" /><TextoCaso texto={casos[0].texto} /></>)
    for (const name of ['Aprendiz', 'Detective', 'Inspector']) expect(screen.getByRole('heading', { name })).toBeTruthy()
    const articulo = screen.getByRole('article', { name: casos[0].texto.titulo })
    expect(within(articulo).getByText(casos[0].texto.autor)).toBeTruthy()
    expect(within(articulo).getByText(casos[0].texto.fuente)).toBeTruthy()
    expect(articulo.querySelectorAll('p').length).toBe(3)
  })

  it('aplica pistas antes de ganar puntos y conserva las respuestas al navegar', async () => {
    const user = userEvent.setup()
    window.location.hash = '/caso/1'
    // jsdom no implementa el desplazamiento visual.
    window.HTMLElement.prototype.scrollIntoView = vi.fn()
    render(<App />)
    await user.click(screen.getAllByRole('button', { name: /Revelar pista/ })[0])
    expect(screen.getByRole('status').textContent).toContain('0 / 400')
    const form = screen.getByRole('form', { name: pregunta.enunciado })
    await user.click(within(form).getAllByRole('radio')[0])
    await user.click(within(form).getByRole('button'))
    expect(screen.getByRole('status').textContent).toContain('15 / 400')
    expect(screen.getByText('1 / 5 · 20%')).toBeTruthy()
    expect(screen.getByText('1 / 20 · 5%')).toBeTruthy()
    await user.click(screen.getByRole('link', { name: 'Inicio' }))
    await user.click(screen.getByRole('link', { name: 'Comenzar caso' }))
    await user.click(screen.getByRole('link', { name: 'Continuar investigación' }))
    expect(screen.getByRole('status').textContent).toContain('15 / 400')
    expect(within(screen.getByRole('form', { name: pregunta.enunciado })).getByRole('button').getAttribute('aria-disabled')).toBe('true')
  })
})
