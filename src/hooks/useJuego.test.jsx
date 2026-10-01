// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import useJuego from './useJuego.js'
import { CLAVE_JUEGO } from './juegoModelo.js'

// Catálogo de prueba con niveles publicados; no modifica los casos pendientes reales.
const catalogo = ['básica', 'intermedia', 'avanzada'].map((dificultad, index) => ({
  id: index + 1, dificultad,
  preguntas: Array.from({ length: 10 }, (_, n) => ({
    id: 'c' + (index + 1) + '-p' + n, puntos: 10, tipo: 'opcion-multiple',
    opciones: [{ id: 'a', texto: 'Correcta' }, { id: 'b', texto: 'Incorrecta' }], respuestaCorrecta: 'a'
  }))
}))

function terminar(result, caso, aciertos = 10) {
  act(() => { catalogo[caso - 1].preguntas.forEach((p, index) => {
    result.current.responder(p.id, { respuesta: index < aciertos ? 'a' : 'b', puntos: 999 })
  }) })
}

beforeEach(() => { window.localStorage.clear() })
afterEach(() => { cleanup(); vi.restoreAllMocks(); window.localStorage.clear() })

describe('useJuego', () => {
  it('solo desbloquea con el 70% y todas las preguntas evaluadas; otorga la insignia al terminar', () => {
    const { result } = renderHook(() => useJuego(catalogo))
    expect(result.current.estaDesbloqueado(1)).toBe(true)
    expect(result.current.estaDesbloqueado(2)).toBe(false)
    act(() => catalogo[0].preguntas.slice(0, 7).forEach(p => result.current.responder(p.id, { respuesta: 'a' })))
    expect(result.current.puntos).toBe(70)
    expect(result.current.estaDesbloqueado(2)).toBe(false)
    expect(result.current.insigniasGanadas).toEqual([])
    terminar(result, 1, 7)
    expect(result.current.resumenes[0].porcentaje).toBe(70)
    expect(result.current.estaDesbloqueado(2)).toBe(true)
    expect(result.current.estaDesbloqueado(3)).toBe(false)
    expect(result.current.insigniasGanadas).toEqual([{ casoId: 1, nivel: 'aprendiz' }])
    act(() => result.current.seleccionarCaso(2))
    expect(result.current.casoActual).toBe(2)
    terminar(result, 2)
    expect(result.current.estaDesbloqueado(3)).toBe(true)
    terminar(result, 3)
    expect(result.current.insigniasGanadas.map(i => i.nivel)).toEqual(['aprendiz', 'detective', 'inspector'])
  })

  it('incluye las pistas en el umbral, cobra una sola vez y no permite responder casos bloqueados', () => {
    const { result } = renderHook(() => useJuego(catalogo))
    act(() => {
      result.current.seleccionarCaso(2)
      result.current.responder('c2-p0', { respuesta: 'a' })
      result.current.descontar('c2-p0')
      result.current.descontar('c1-p0')
      result.current.descontar('c1-p0')
    })
    expect(result.current.casoActual).toBe(1)
    expect(result.current.pistasUsadas).toEqual(['c1-p0'])
    expect(result.current.puntos).toBe(0)
    terminar(result, 1, 7)
    expect(result.current.resumenes[0].puntos).toBe(65)
    expect(result.current.casosCompletados).toEqual([1])
    expect(result.current.estaDesbloqueado(2)).toBe(false)
    act(() => result.current.responder('c1-p9', { respuesta: 'a' }))
    expect(result.current.puntos).toBe(65)
  })

  it('resta dos pistas y permite avanzar con exactamente 70 puntos netos', () => {
    const { result } = renderHook(() => useJuego(catalogo))
    act(() => { result.current.descontar('c1-p0'); result.current.descontar('c1-p1') })
    terminar(result, 1, 8)
    expect(result.current.resumenes[0].puntos).toBe(70)
    expect(result.current.estaDesbloqueado(2)).toBe(true)
  })

  it('recupera el caso actual, respuestas, pistas, completados e insignias después de recargar', () => {
    const primera = renderHook(() => useJuego(catalogo))
    terminar(primera.result, 1)
    act(() => { primera.result.current.seleccionarCaso(2); primera.result.current.descontar('c2-p0') })
    primera.unmount()
    const segunda = renderHook(() => useJuego(catalogo))
    expect(segunda.result.current.casoActual).toBe(2)
    expect(segunda.result.current.casosCompletados).toEqual([1])
    expect(segunda.result.current.insigniasGanadas).toEqual([{ casoId: 1, nivel: 'aprendiz' }])
    expect(segunda.result.current.pistasUsadas).toEqual(['c2-p0'])
    expect(segunda.result.current.puntos).toBe(100)
  })

  it('reintentar revoca el avance dependiente y reiniciar limpia el progreso persistido', () => {
    const { result } = renderHook(() => useJuego(catalogo))
    terminar(result, 1)
    terminar(result, 2)
    act(() => result.current.reintentarCaso(1))
    expect(result.current.casosCompletados).toEqual([])
    expect(result.current.insigniasGanadas).toEqual([])
    expect(result.current.puntos).toBe(0)
    expect(result.current.estaDesbloqueado(2)).toBe(false)
    terminar(result, 1)
    act(() => result.current.reiniciarJuego())
    expect(result.current.casoActual).toBe(1)
    expect(result.current.respuestas).toEqual({})
    expect(result.current.pistasUsadas).toEqual([])
    expect(JSON.parse(window.localStorage.getItem(CLAVE_JUEGO)).respuestas).toEqual({})
  })

  it('funciona y reinicia cuando localStorage está bloqueado', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Bloqueado') })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Bloqueado') })
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('Bloqueado') })
    const { result } = renderHook(() => useJuego(catalogo))
    expect(result.current.almacenamientoDisponible).toBe(false)
    terminar(result, 1)
    expect(result.current.puntos).toBe(100)
    act(() => result.current.reiniciarJuego())
    expect(result.current.puntos).toBe(0)
  })

  it('ignora JSON corrupto y recalcula puntos sin confiar en valores guardados', () => {
    window.localStorage.setItem(CLAVE_JUEGO, '{datos rotos')
    const primera = renderHook(() => useJuego(catalogo))
    expect(primera.result.current.puntos).toBe(0)
    primera.unmount()
    window.localStorage.setItem(CLAVE_JUEGO, JSON.stringify({
      version: 1, casoActual: 3, respuestas: {
        'c1-p0': { respuesta: 'a', correcta: false, puntos: 999 },
        'c2-p0': { respuesta: 'a', puntos: 999 }
      }, pistas: { 'c1-p1': -100 }
    }))
    const segunda = renderHook(() => useJuego(catalogo))
    expect(segunda.result.current.puntos).toBe(10)
    expect(segunda.result.current.casoActual).toBe(1)
    expect(segunda.result.current.respuestas['c2-p0']).toBeUndefined()
    expect(segunda.result.current.pistasUsadas).toEqual([])
  })

  it('una respuesta abierta sin valorar no completa el nivel ni gana insignia', () => {
    const abierto = [{ id: 1, dificultad: 'avanzada', preguntas: [{ id: 'abierta', tipo: 'abierta', puntos: 100, opciones: [] }] }]
    const { result } = renderHook(() => useJuego(abierto))
    act(() => result.current.responder('abierta', { respuesta: 'Mi postura', correcta: true, puntos: 100 }))
    expect(result.current.puntos).toBe(0)
    expect(result.current.casosCompletados).toEqual([])
    expect(result.current.insigniasGanadas).toEqual([])
  })
})
